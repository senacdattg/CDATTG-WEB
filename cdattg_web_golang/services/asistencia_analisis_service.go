package services

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

type AsistenciaAnalisisParams struct {
	FechaDesde    string
	FechaHasta    string
	RegionalID    *uint
	SedeID        *uint
	Jornada       string
	FichaBusqueda string // número de ficha o nombre de programa
	EstadoFicha   string // activas | inactivas | todas
	TipoFormacion string // FORMACION_REGULAR | MEDIA_TECNICA | FORMACION_COMPLEMENTARIA | vacío=todas
	AprendizID    *uint
	DiaSemanaID   *int
}

type AnalisisRegistrosAprendizParams struct {
	FechaDesde  string
	FechaHasta  string
	RegionalID  *uint
	SedeID      *uint
	FichaNumero string
	Busqueda    string
	AprendizID  *uint
}

type AnalisisExplorarParams struct {
	Query      string
	RegionalID *uint
	SedeID     *uint
}

type AnalisisAprendicesFichaParams struct {
	FechaDesde  string
	FechaHasta  string
	RegionalID  *uint
	SedeID      *uint
	FichaNumero string
	Busqueda    string
}

type AsistenciaAnalisisService interface {
	GetAnalisis(userID uint, roles []string, p AsistenciaAnalisisParams) (*dto.AsistenciaAnalisisResponse, error)
	ExplorarFichas(userID uint, roles []string, p AnalisisExplorarParams) (*dto.AnalisisExplorarFichasResponse, error)
	ListAprendicesFicha(userID uint, roles []string, p AnalisisAprendicesFichaParams) (*dto.AnalisisAprendicesFichaResponse, error)
	GetRegistrosAprendiz(userID uint, roles []string, p AnalisisRegistrosAprendizParams) (*dto.AnalisisRegistrosAprendizResponse, error)
}

type asistenciaAnalisisService struct {
	scopeSvc     DashboardScopeService
	fichaRepo    repositories.FichaRepository
	aprendizRepo repositories.AprendizRepository
	analisisRepo repositories.AsistenciaAnalisisRepository
	asistRepo    repositories.AsistenciaRepository
	calendario   *CalendarioFormacionService
	horarioSvc   *InstructorHorarioService
}

func NewAsistenciaAnalisisService() AsistenciaAnalisisService {
	return &asistenciaAnalisisService{
		scopeSvc:     NewDashboardScopeService(),
		fichaRepo:    repositories.NewFichaRepository(),
		aprendizRepo: repositories.NewAprendizRepository(),
		analisisRepo: repositories.NewAsistenciaAnalisisRepository(),
		asistRepo:    repositories.NewAsistenciaRepository(),
		calendario:   NewCalendarioFormacionService(),
		horarioSvc:   NewInstructorHorarioService(),
	}
}

var nombresDiaSemana = map[int]string{
	1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves",
	5: "Viernes", 6: "Sábado", 7: "Domingo",
}

func normalizarEstadoFicha(v string) string {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "inactivas":
		return "inactivas"
	case "todas":
		return "todas"
	default:
		return "activas"
	}
}

func (s *asistenciaAnalisisService) resolverFichaIDs(busqueda string, sedeIDs []uint) ([]uint, bool, error) {
	q := strings.TrimSpace(busqueda)
	if q == "" {
		return nil, false, nil
	}
	if f, err := s.fichaRepo.FindByFicha(q); err == nil && f != nil {
		return []uint{f.ID}, false, nil
	}
	ids, err := s.fichaRepo.FindIDsByFichaOPrograma(q, sedeIDs)
	if err != nil {
		return nil, false, err
	}
	if len(ids) == 0 {
		return nil, true, nil
	}
	return ids, false, nil
}

func (s *asistenciaAnalisisService) GetAnalisis(userID uint, roles []string, p AsistenciaAnalisisParams) (*dto.AsistenciaAnalisisResponse, error) {
	scope, err := s.scopeSvc.Resolve(userID, roles)
	if err != nil {
		return nil, err
	}
	sedeIDs, empty := s.scopeSvc.ResolveEffectiveSedes(scope, p.RegionalID, p.SedeID)
	if empty {
		return emptyAnalisisResponse(p), nil
	}

	desde, hasta, err := parseRangoAnalisis(p.FechaDesde, p.FechaHasta)
	if err != nil {
		return nil, err
	}
	jornada := strings.TrimSpace(p.Jornada)
	estadoFicha := normalizarEstadoFicha(p.EstadoFicha)
	tipoFormacion, errTipo := normalizeTipoFormacionFilter(p.TipoFormacion)
	if errTipo != nil {
		return nil, errTipo
	}

	fichaIDs, sinMatch, err := s.resolverFichaIDs(p.FichaBusqueda, sedeIDs)
	if err != nil {
		return nil, err
	}
	if sinMatch {
		return emptyAnalisisResponse(p), nil
	}

	horaToma, err := s.buildHoraToma(desde, hasta, sedeIDs, fichaIDs, p.AprendizID, repositories.AnalisisSesionFiltros{
		Jornada:       jornada,
		EstadoFicha:   estadoFicha,
		TipoFormacion: tipoFormacion,
	})
	if err != nil {
		return nil, err
	}
	cumplimiento, err := s.buildCumplimiento(desde, hasta, sedeIDs, fichaIDs, repositories.AnalisisSesionFiltros{
		Jornada:       jornada,
		EstadoFicha:   estadoFicha,
		TipoFormacion: tipoFormacion,
	}, horaToma.sesionesPorFicha)
	if err != nil {
		return nil, err
	}
	diaSemana, err := s.buildSemanaAnterior(sedeIDs, jornada, p.DiaSemanaID, fichaIDs, estadoFicha, tipoFormacion)
	if err != nil {
		return nil, err
	}
	enriquecerHoraTomaConCumplimiento(&horaToma.section, cumplimiento)
	return &dto.AsistenciaAnalisisResponse{
		FechaDesde:   desde.Format(time.DateOnly),
		FechaHasta:   hasta.Add(-24 * time.Hour).Format(time.DateOnly),
		HoraToma:     horaToma.section,
		Cumplimiento: cumplimiento,
		DiaSemana:    diaSemana,
	}, nil
}

func validarParamsRegistrosAprendiz(p AnalisisRegistrosAprendizParams) (fichaNum string, err error) {
	fichaNum = strings.TrimSpace(p.FichaNumero)
	if fichaNum == "" {
		return "", fmt.Errorf("ficha es obligatoria")
	}
	return fichaNum, nil
}

func fichaEnAlcanceSedes(ficha *models.FichaCaracterizacion, sedeIDs []uint) bool {
	if len(sedeIDs) == 0 || ficha.SedeID == nil {
		return true
	}
	for _, sid := range sedeIDs {
		if *ficha.SedeID == sid {
			return true
		}
	}
	return false
}

func (s *asistenciaAnalisisService) nombreProgramaFicha(ficha *models.FichaCaracterizacion) string {
	if nombre := models.NombreProgramaDisplay(ficha); nombre != "" {
		return nombre
	}
	if ficha == nil {
		return ""
	}
	f, err := s.fichaRepo.FindByID(ficha.ID)
	if err != nil || f == nil {
		return ""
	}
	return models.NombreProgramaDisplay(f)
}

func (s *asistenciaAnalisisService) resolverFichaEnAlcance(
	fichaNum string,
	userID uint,
	roles []string,
	regionalID, sedeID *uint,
) (*models.FichaCaracterizacion, []uint, error) {
	scope, err := s.scopeSvc.Resolve(userID, roles)
	if err != nil {
		return nil, nil, err
	}
	sedeIDs, empty := s.scopeSvc.ResolveEffectiveSedes(scope, regionalID, sedeID)
	if empty {
		return nil, nil, fmt.Errorf("sin alcance de sedes")
	}
	ficha, err := s.fichaRepo.FindByFicha(fichaNum)
	if err != nil {
		return nil, nil, fmt.Errorf("ficha no encontrada")
	}
	if !fichaEnAlcanceSedes(ficha, sedeIDs) {
		return nil, nil, fmt.Errorf("ficha fuera de su alcance")
	}
	return ficha, sedeIDs, nil
}

func (s *asistenciaAnalisisService) ExplorarFichas(
	userID uint,
	roles []string,
	p AnalisisExplorarParams,
) (*dto.AnalisisExplorarFichasResponse, error) {
	q := strings.TrimSpace(p.Query)
	if q == "" {
		return nil, fmt.Errorf("indique ficha, programa, nombre o documento")
	}
	scope, err := s.scopeSvc.Resolve(userID, roles)
	if err != nil {
		return nil, err
	}
	sedeIDs, empty := s.scopeSvc.ResolveEffectiveSedes(scope, p.RegionalID, p.SedeID)
	if empty {
		return &dto.AnalisisExplorarFichasResponse{Query: q, Fichas: []dto.AnalisisFichaExplorarItem{}}, nil
	}
	rows, err := s.analisisRepo.FindFichasExplorar(q, sedeIDs, 60)
	if err != nil {
		return nil, err
	}
	out := make([]dto.AnalisisFichaExplorarItem, 0, len(rows))
	for i := range rows {
		r := &rows[i]
		out = append(out, dto.AnalisisFichaExplorarItem{
			FichaID:               r.FichaID,
			FichaNumero:           r.FichaNumero,
			ProgramaNombre:        r.ProgramaNombre,
			SedeNombre:            r.SedeNombre,
			JornadaNombre:         r.JornadaNombre,
			ModalidadNombre:       r.ModalidadNombre,
			InstructorNombre:      r.InstructorNombre,
			AmbienteNombre:        r.AmbienteNombre,
			CantidadAprendices:    r.CantidadAprendices,
			Status:                r.Status,
			CoincidenciasAprendiz: r.CoincidenciasAprendiz,
		})
	}
	return &dto.AnalisisExplorarFichasResponse{Query: q, Fichas: out}, nil
}

func (s *asistenciaAnalisisService) ListAprendicesFicha(
	userID uint,
	roles []string,
	p AnalisisAprendicesFichaParams,
) (*dto.AnalisisAprendicesFichaResponse, error) {
	fichaNum := strings.TrimSpace(p.FichaNumero)
	if fichaNum == "" {
		return nil, fmt.Errorf("ficha es obligatoria")
	}
	ficha, _, err := s.resolverFichaEnAlcance(fichaNum, userID, roles, p.RegionalID, p.SedeID)
	if err != nil {
		return nil, err
	}
	desde, hasta, err := parseRangoAnalisis(p.FechaDesde, p.FechaHasta)
	if err != nil {
		return nil, err
	}
	rows, err := s.analisisRepo.FindAprendicesResumenPorFicha(ficha.ID, desde, hasta, p.Busqueda)
	if err != nil {
		return nil, err
	}
	aprendices := make([]dto.AnalisisAprendizResumen, 0, len(rows))
	for i := range rows {
		r := &rows[i]
		aprendices = append(aprendices, dto.AnalisisAprendizResumen{
			AprendizID:      r.AprendizID,
			NumeroDocumento: r.NumeroDocumento,
			NombreCompleto:  nombreCompletoDesdePartes(r.PrimerNombre, r.SegundoNombre, r.PrimerApellido, r.SegundoApellido),
			TotalRegistros:  r.TotalRegistros,
		})
	}
	return &dto.AnalisisAprendicesFichaResponse{
		FichaID:        ficha.ID,
		FichaNumero:    ficha.Ficha,
		ProgramaNombre: s.nombreProgramaFicha(ficha),
		Aprendices:     aprendices,
	}, nil
}

func nombreCompletoDesdePartes(parts ...string) string {
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if strings.TrimSpace(p) != "" {
			out = append(out, strings.TrimSpace(p))
		}
	}
	return strings.Join(out, " ")
}

func (s *asistenciaAnalisisService) GetRegistrosAprendiz(
	userID uint,
	roles []string,
	p AnalisisRegistrosAprendizParams,
) (*dto.AnalisisRegistrosAprendizResponse, error) {
	fichaNum, err := validarParamsRegistrosAprendiz(p)
	if err != nil {
		return nil, err
	}
	ficha, _, err := s.resolverFichaEnAlcance(fichaNum, userID, roles, p.RegionalID, p.SedeID)
	if err != nil {
		return nil, err
	}

	desde, hasta, err := parseRangoAnalisis(p.FechaDesde, p.FechaHasta)
	if err != nil {
		return nil, err
	}

	rows, err := s.analisisRepo.FindRegistrosAprendizPorFicha(ficha.ID, desde, hasta, p.Busqueda, p.AprendizID)
	if err != nil {
		return nil, err
	}

	return &dto.AnalisisRegistrosAprendizResponse{
		FichaID:        ficha.ID,
		FichaNumero:    ficha.Ficha,
		ProgramaNombre: s.nombreProgramaFicha(ficha),
		Aprendices:     agruparRegistrosAprendiz(rows),
	}, nil
}

func formatoHoraPtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	loc := utils.AppLocation()
	s := t.In(loc).Format("15:04")
	return &s
}

func nombreCompletoAprendizRow(r repositories.AprendizRegistroRow) string {
	return nombreCompletoDesdePartes(r.PrimerNombre, r.SegundoNombre, r.PrimerApellido, r.SegundoApellido)
}

func agruparRegistrosAprendiz(rows []repositories.AprendizRegistroRow) []dto.AnalisisAprendizConRegistros {
	loc := utils.AppLocation()
	order := make([]uint, 0)
	byID := make(map[uint]*dto.AnalisisAprendizConRegistros)

	for i := range rows {
		r := &rows[i]
		entry, ok := byID[r.AprendizID]
		if !ok {
			entry = &dto.AnalisisAprendizConRegistros{
				AprendizID:      r.AprendizID,
				NumeroDocumento: r.NumeroDocumento,
				NombreCompleto:  nombreCompletoAprendizRow(*r),
				Registros:       make([]dto.AnalisisRegistroIngresoSalida, 0),
			}
			byID[r.AprendizID] = entry
			order = append(order, r.AprendizID)
		}
		entry.Registros = append(entry.Registros, dto.AnalisisRegistroIngresoSalida{
			AsistenciaID: r.AsistenciaID,
			Fecha:        r.Fecha.In(loc).Format(time.DateOnly),
			HoraIngreso:  formatoHoraPtr(r.HoraIngreso),
			HoraSalida:   formatoHoraPtr(r.HoraSalida),
		})
	}

	out := make([]dto.AnalisisAprendizConRegistros, 0, len(order))
	for _, id := range order {
		out = append(out, *byID[id])
	}
	return out
}

func emptyAnalisisResponse(p AsistenciaAnalisisParams) *dto.AsistenciaAnalisisResponse {
	return &dto.AsistenciaAnalisisResponse{
		FechaDesde: p.FechaDesde,
		FechaHasta: p.FechaHasta,
		HoraToma: dto.AnalisisHoraTomaSection{
			DetallePorFicha: []dto.AnalisisHoraTomaPorFicha{},
		},
		Cumplimiento: dto.AnalisisCumplimientoSection{Items: []dto.AnalisisCumplimientoFicha{}},
		DiaSemana: dto.AnalisisDiaSemanaSection{
			SemanaDesde:       "",
			SemanaHasta:       "",
			PorDia:            []dto.AnalisisDiaSemanaFila{},
			DiasMasAsistencia: []dto.AnalisisDiaRanking{},
		},
	}
}

func parseRangoAnalisis(desdeStr, hastaStr string) (time.Time, time.Time, error) {
	loc := utils.AppLocation()
	now := time.Now().In(loc)
	if strings.TrimSpace(hastaStr) == "" {
		hastaStr = now.Format(time.DateOnly)
	}
	if strings.TrimSpace(desdeStr) == "" {
		d := now.AddDate(0, 0, -89)
		desdeStr = d.Format(time.DateOnly)
	}
	desde, err := time.ParseInLocation(time.DateOnly, desdeStr, loc)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("fecha_desde inválida")
	}
	hastaDay, err := time.ParseInLocation(time.DateOnly, hastaStr, loc)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("fecha_hasta inválida")
	}
	hasta := hastaDay.Add(24 * time.Hour)
	if !desde.Before(hasta) {
		return time.Time{}, time.Time{}, fmt.Errorf("fecha_desde debe ser anterior a fecha_hasta")
	}
	return desde, hasta, nil
}

func formatoHoraDesdeMinutos(m int) string {
	if m < 0 {
		m = 0
	}
	h := m / 60
	mi := m % 60
	return fmt.Sprintf("%02d:%02d", h, mi)
}

func formatoHoraPromedio(vals []int) string {
	if len(vals) == 0 {
		return "—"
	}
	return formatoHoraDesdeMinutos(promedioMinutos(vals))
}

func promedioMinutos(vals []int) int {
	if len(vals) == 0 {
		return 0
	}
	sum := 0
	for _, v := range vals {
		sum += v
	}
	return int(math.Round(float64(sum) / float64(len(vals))))
}

type horaTomaBuildResult struct {
	section          dto.AnalisisHoraTomaSection
	sesionesPorFicha map[uint]*fichaSesionesAgrupadas
}

func (s *asistenciaAnalisisService) buildHoraToma(
	desde, hasta time.Time,
	sedeIDs []uint,
	fichaIDs []uint,
	aprendizID *uint,
	filtros repositories.AnalisisSesionFiltros,
) (horaTomaBuildResult, error) {
	rows, err := s.analisisRepo.FindSesionesDetalle(desde, hasta, sedeIDs, fichaIDs, aprendizID, filtros)
	if err != nil {
		return horaTomaBuildResult{}, err
	}
	loc := utils.AppLocation()
	agrupado := agruparSesionesPorFicha(rows, loc)

	allIngreso := make([]int, 0, len(rows))
	allSalida := make([]int, 0, len(rows))
	for _, entry := range agrupado {
		allIngreso = append(allIngreso, entry.minutosIngreso...)
		allSalida = append(allSalida, entry.minutosSalida...)
	}
	avgIngreso := promedioMinutos(allIngreso)
	avgSalida := promedioMinutos(allSalida)

	totalDias := make(map[string]struct{})
	detalle := make([]dto.AnalisisHoraTomaPorFicha, 0, len(agrupado))
	for fid, e := range agrupado {
		for fecha := range e.fechas {
			totalDias[fecha] = struct{}{}
		}
		detalle = append(detalle, dto.AnalisisHoraTomaPorFicha{
			FichaID:            fid,
			FichaNumero:        e.numero,
			ProgramaNombre:     e.programa,
			JornadaNombre:      e.jornada,
			FichaActiva:        e.activa,
			PromedioHora:       formatoHoraPromedio(e.minutosIngreso),
			PromedioHoraSalida: formatoHoraPromedio(e.minutosSalida),
			TotalSesiones:      e.totalSesiones,
			DiasConSesion:      len(e.fechas),
		})
	}
	sort.Slice(detalle, func(i, j int) bool { return detalle[i].FichaNumero < detalle[j].FichaNumero })

	totalSesiones := 0
	for _, e := range agrupado {
		totalSesiones += e.totalSesiones
	}
	return horaTomaBuildResult{
		section: dto.AnalisisHoraTomaSection{
			PromedioHora:          formatoHoraPromedio(allIngreso),
			PromedioMinutosDia:    avgIngreso,
			PromedioHoraSalida:    formatoHoraPromedio(allSalida),
			PromedioMinutosSalida: avgSalida,
			TotalSesiones:         totalSesiones,
			TotalDiasConSesion:    len(totalDias),
			DetallePorFicha:       detalle,
		},
		sesionesPorFicha: agrupado,
	}, nil
}

func (s *asistenciaAnalisisService) fichaTieneFormacionEnDia(f *models.FichaCaracterizacion, dia time.Time) bool {
	if f == nil {
		return false
	}
	if s.calendario.EsDiaFestivoColombia(dia) {
		return false
	}
	if f.SedeID != nil && *f.SedeID > 0 && s.calendario.EsDiaSinFormacionSede(*f.SedeID, dia) {
		return false
	}
	if s.calendario.EsDiaSinFormacionFicha(f.ID, dia) {
		return false
	}
	diaID := WeekdayToDiaFormacionID(dia.Weekday())
	return len(s.horarioSvc.bloquesDiaFicha(f, diaID)) > 0
}

func rangoDiasFichaEnConsulta(f *models.FichaCaracterizacion, desde, hasta time.Time) (time.Time, time.Time) {
	loc := utils.AppLocation()
	start := desde.In(loc)
	end := hasta.Add(-time.Second).In(loc)
	if f.FechaInicio != nil {
		fi, _ := time.ParseInLocation(time.DateOnly, f.FechaInicio.Format(time.DateOnly), loc)
		if fi.After(start) {
			start = fi
		}
	}
	if f.FechaFin != nil {
		ff, _ := time.ParseInLocation(time.DateOnly, f.FechaFin.Format(time.DateOnly), loc)
		if ff.Before(end) {
			end = ff
		}
	}
	return start, end
}

func (s *asistenciaAnalisisService) buildCumplimiento(
	desde, hasta time.Time,
	sedeIDs []uint,
	fichaIDs []uint,
	filtros repositories.AnalisisSesionFiltros,
	sesionesPorFicha map[uint]*fichaSesionesAgrupadas,
) (dto.AnalisisCumplimientoSection, error) {
	fichas, err := s.fichaRepo.FindSolapandoRango(desde, hasta, sedeIDs, filtros.Jornada, false, filtros.EstadoFicha)
	if err != nil {
		return dto.AnalisisCumplimientoSection{}, err
	}
	fichas = filtrarFichasPorIDs(fichas, fichaIDs)
	fichas = filtrarFichasPorTipoFormacion(fichas, filtros.TipoFormacion)

	items := make([]dto.AnalisisCumplimientoFicha, 0, len(fichas))
	for i := range fichas {
		f := &fichas[i]
		entry := sesionesPorFicha[f.ID]
		totalSesiones := 0
		if entry != nil {
			totalSesiones = entry.totalSesiones
		}
		item, err := s.itemCumplimientoFicha(f, desde, hasta, fechasSesionFicha(sesionesPorFicha, f.ID), totalSesiones)
		if err != nil {
			return dto.AnalisisCumplimientoSection{}, err
		}
		if item != nil {
			items = append(items, *item)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].PctCumplimiento < items[j].PctCumplimiento })
	return dto.AnalisisCumplimientoSection{Items: items}, nil
}

// rangoSemanaAnteriorCompleta devuelve [lunes, lunes) de la semana calendario anterior a la actual.
func rangoSemanaAnteriorCompleta(ref time.Time) (time.Time, time.Time) {
	loc := utils.AppLocation()
	ref = ref.In(loc)
	daysSinceMonday := int(ref.Weekday() - time.Monday)
	if ref.Weekday() == time.Sunday {
		daysSinceMonday = 6
	}
	mondayThisWeek := ref.AddDate(0, 0, -daysSinceMonday)
	mondayPrev := mondayThisWeek.AddDate(0, 0, -7)
	return mondayPrev, mondayThisWeek
}

func (s *asistenciaAnalisisService) buildSemanaAnterior(
	sedeIDs []uint,
	jornada string,
	diaSemanaID *int,
	fichaIDs []uint,
	estadoFicha string,
	tipoFormacion string,
) (dto.AnalisisDiaSemanaSection, error) {
	loc := utils.AppLocation()
	desde, hasta := rangoSemanaAnteriorCompleta(time.Now())
	endDay := hasta.Add(-time.Second)

	porDia := make([]dto.AnalisisDiaSemanaFila, 0, 7)
	rankingRows := make([]dto.AnalisisDiaRanking, 0, 7)

	for d := desde.In(loc); !d.After(endDay); d = d.AddDate(0, 0, 1) {
		diaID := int(WeekdayToDiaFormacionID(d.Weekday()))
		if diaSemanaID != nil && *diaSemanaID > 0 && diaID != *diaSemanaID {
			continue
		}
		diaRes, err := s.procesarDiaSemanaAnterior(d, sedeIDs, jornada, fichaIDs, estadoFicha, tipoFormacion)
		if err != nil {
			return dto.AnalisisDiaSemanaSection{}, err
		}
		porDia = append(porDia, diaRes.filas...)
		if diaRes.ranking != nil {
			rankingRows = append(rankingRows, *diaRes.ranking)
		}
	}

	sort.Slice(porDia, func(i, j int) bool {
		if porDia[i].Fecha != porDia[j].Fecha {
			return porDia[i].Fecha < porDia[j].Fecha
		}
		return porDia[i].JornadaNombre < porDia[j].JornadaNombre
	})
	sort.Slice(rankingRows, func(i, j int) bool {
		if rankingRows[i].Vinieron != rankingRows[j].Vinieron {
			return rankingRows[i].Vinieron > rankingRows[j].Vinieron
		}
		return rankingRows[i].Pct > rankingRows[j].Pct
	})

	return dto.AnalisisDiaSemanaSection{
		SemanaDesde:       desde.Format(time.DateOnly),
		SemanaHasta:       endDay.Format(time.DateOnly),
		PorDia:            porDia,
		DiasMasAsistencia: rankingRows,
	}, nil
}
