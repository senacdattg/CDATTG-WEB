package services

import (
	"math"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/utils"
)

type cumplimientoDiasResult struct {
	programados int
	conSesion   int
	detalle     []dto.AnalisisCumplimientoDia
	resumen     dto.AnalisisCumplimientoResumen
}

type semanaDiaResult struct {
	filas   []dto.AnalisisDiaSemanaFila
	ranking *dto.AnalisisDiaRanking
}

// fichaSesionesAgrupadas fuente única de conteo de sesiones (bloques A y B).
type fichaSesionesAgrupadas struct {
	numero         string
	programa       string
	jornada        string
	activa         bool
	totalSesiones  int
	fechas         map[string]struct{}
	minutosIngreso []int
	minutosSalida  []int
}

func minutosDeHora(t *time.Time, loc *time.Location) (int, bool) {
	if t == nil {
		return 0, false
	}
	local := t.In(loc)
	return local.Hour()*60 + local.Minute(), true
}

func agruparSesionesPorFicha(rows []repositories.SesionDetalleRow, loc *time.Location) map[uint]*fichaSesionesAgrupadas {
	out := make(map[uint]*fichaSesionesAgrupadas)
	for i := range rows {
		row := &rows[i]
		entry := out[row.FichaID]
		if entry == nil {
			entry = &fichaSesionesAgrupadas{
				numero:   row.FichaNumero,
				programa: row.ProgramaNombre,
				jornada:  row.JornadaNombre,
				activa:   row.FichaActiva,
				fechas:   make(map[string]struct{}),
			}
			out[row.FichaID] = entry
		}
		entry.totalSesiones++
		fechaKey := row.Fecha.In(loc).Format(time.DateOnly)
		entry.fechas[fechaKey] = struct{}{}
		if m, ok := minutosDeHora(row.PrimeraHora, loc); ok {
			entry.minutosIngreso = append(entry.minutosIngreso, m)
		}
		if m, ok := minutosDeHora(row.UltimaHora, loc); ok {
			entry.minutosSalida = append(entry.minutosSalida, m)
		}
	}
	return out
}

func fechasSesionFicha(agrupado map[uint]*fichaSesionesAgrupadas, fichaID uint) map[string]struct{} {
	entry := agrupado[fichaID]
	if entry == nil {
		return map[string]struct{}{}
	}
	out := make(map[string]struct{}, len(entry.fechas))
	for k := range entry.fechas {
		out[k] = struct{}{}
	}
	return out
}

// enriquecerHoraTomaConCumplimiento alinea «días con sesión» del bloque A con «con sesión» del bloque B.
func enriquecerHoraTomaConCumplimiento(hora *dto.AnalisisHoraTomaSection, cumpl dto.AnalisisCumplimientoSection) {
	porFicha := make(map[uint]int, len(cumpl.Items))
	for i := range cumpl.Items {
		porFicha[cumpl.Items[i].FichaID] = cumpl.Items[i].DiasConSesion
	}
	total := 0
	for i := range hora.DetallePorFicha {
		if d, ok := porFicha[hora.DetallePorFicha[i].FichaID]; ok {
			hora.DetallePorFicha[i].DiasConSesion = d
			total += d
		}
	}
	hora.TotalDiasConSesion = total
}

func filtrarFichasPorID(fichas []models.FichaCaracterizacion, fichaID *uint) []models.FichaCaracterizacion {
	if fichaID == nil || *fichaID == 0 {
		return fichas
	}
	return filtrarFichasPorIDs(fichas, []uint{*fichaID})
}

func filtrarFichasPorIDs(fichas []models.FichaCaracterizacion, fichaIDs []uint) []models.FichaCaracterizacion {
	if len(fichaIDs) == 0 {
		return fichas
	}
	permitidos := make(map[uint]struct{}, len(fichaIDs))
	for _, id := range fichaIDs {
		permitidos[id] = struct{}{}
	}
	out := make([]models.FichaCaracterizacion, 0, len(fichaIDs))
	for i := range fichas {
		if _, ok := permitidos[fichas[i].ID]; ok {
			out = append(out, fichas[i])
		}
	}
	return out
}

func filtrarFichasPorTipoFormacion(fichas []models.FichaCaracterizacion, tipoFormacion string) []models.FichaCaracterizacion {
	tipo := strings.TrimSpace(tipoFormacion)
	if tipo == "" {
		return fichas
	}
	out := make([]models.FichaCaracterizacion, 0, len(fichas))
	for i := range fichas {
		if tipoFormacionEfectivo(fichas[i].TipoFormacion) == tipo {
			out = append(out, fichas[i])
		}
	}
	return out
}

func fichaPasaFiltroIDs(fichaID uint, fichaIDs []uint) bool {
	if len(fichaIDs) == 0 {
		return true
	}
	for _, id := range fichaIDs {
		if id == fichaID {
			return true
		}
	}
	return false
}

func sedeIDUnica(sedeIDs []uint) *uint {
	if len(sedeIDs) != 1 {
		return nil
	}
	return &sedeIDs[0]
}

func fichaPasaFiltrosAnalisis(
	f *models.FichaCaracterizacion,
	d time.Time,
	fichaIDs []uint,
	jornada string,
	tipoFormacion string,
	s *asistenciaAnalisisService,
) bool {
	if !fichaPasaFiltroIDs(f.ID, fichaIDs) {
		return false
	}
	if jornada != "" && (f.Jornada == nil || f.Jornada.Nombre != jornada) {
		return false
	}
	if tipo := strings.TrimSpace(tipoFormacion); tipo != "" && tipoFormacionEfectivo(f.TipoFormacion) != tipo {
		return false
	}
	return s.fichaTieneFormacionEnDia(f, d)
}

func nombresFichaCumplimiento(f *models.FichaCaracterizacion) (programa, jornada, sede string) {
	programa = models.NombreProgramaDisplay(f)
	if f != nil && f.Jornada != nil {
		jornada = f.Jornada.Nombre
	}
	if f != nil && f.Sede != nil {
		sede = f.Sede.Nombre
	}
	return programa, jornada, sede
}

func actualizarResumenCumplimientoDia(resumen *dto.AnalisisCumplimientoResumen, programado, tieneSesion, sinFormacion bool) {
	if sinFormacion {
		resumen.DiasSinFormacion++
		return
	}
	switch {
	case programado && tieneSesion:
		resumen.DiasCumplidos++
	case programado && !tieneSesion:
		resumen.DiasSinToma++
	case !programado && tieneSesion:
		resumen.SesionesFueraProgramacion++
	}
}

func entradaCumplimientoDia(d time.Time, loc *time.Location, programado, tieneSesion, sinFormacion bool, observacion string) dto.AnalisisCumplimientoDia {
	diaID := int(WeekdayToDiaFormacionID(d.Weekday()))
	return dto.AnalisisCumplimientoDia{
		Fecha:        d.In(loc).Format(time.DateOnly),
		DiaSemana:    nombresDiaSemana[diaID],
		Programado:   programado,
		TieneSesion:  tieneSesion,
		SinFormacion: sinFormacion,
		Observacion:  observacion,
	}
}

func (s *asistenciaAnalisisService) diaHubieraSidoFormacion(f *models.FichaCaracterizacion, d time.Time) bool {
	if f == nil || s.calendario.EsDiaFestivoColombia(d) {
		return false
	}
	if f.SedeID != nil && *f.SedeID > 0 && s.calendario.EsDiaSinFormacionSede(*f.SedeID, d) {
		return false
	}
	diaID := WeekdayToDiaFormacionID(d.Weekday())
	return len(s.horarioSvc.bloquesDiaFicha(f, diaID)) > 0
}

func (s *asistenciaAnalisisService) acumularDiaCumplimiento(
	f *models.FichaCaracterizacion,
	d time.Time,
	loc *time.Location,
	sesiones map[string]struct{},
	out *cumplimientoDiasResult,
) {
	key := d.In(loc).Format(time.DateOnly)
	_, tieneSesion := sesiones[key]

	if ok, motivo := s.calendario.MotivoDiaSinFormacionFicha(f.ID, d); ok {
		hubieraFormacion := s.diaHubieraSidoFormacion(f, d)
		if hubieraFormacion || tieneSesion {
			out.detalle = append(out.detalle, entradaCumplimientoDia(d, loc, false, tieneSesion, true, motivo))
			actualizarResumenCumplimientoDia(&out.resumen, false, tieneSesion, true)
		}
		return
	}

	programado := s.fichaTieneFormacionEnDia(f, d)
	if programado || tieneSesion {
		out.detalle = append(out.detalle, entradaCumplimientoDia(d, loc, programado, tieneSesion, false, ""))
		actualizarResumenCumplimientoDia(&out.resumen, programado, tieneSesion, false)
	}
	if !programado {
		return
	}
	out.programados++
	if tieneSesion {
		out.conSesion++
	}
}

func (s *asistenciaAnalisisService) calcularCumplimientoDias(
	f *models.FichaCaracterizacion,
	start, end time.Time,
	sesiones map[string]struct{},
) cumplimientoDiasResult {
	loc := utils.AppLocation()
	_ = s.calendario.PrecargarSinFormacionFicha(f.ID, start, end)
	if f.SedeID != nil && *f.SedeID > 0 {
		_ = s.calendario.PrecargarSinFormacionSede(*f.SedeID, start, end)
	}
	out := cumplimientoDiasResult{detalle: make([]dto.AnalisisCumplimientoDia, 0)}
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		s.acumularDiaCumplimiento(f, d, loc, sesiones, &out)
	}
	return out
}

func (s *asistenciaAnalisisService) itemCumplimientoFicha(
	f *models.FichaCaracterizacion,
	desde, hasta time.Time,
	sesiones map[string]struct{},
	totalSesiones int,
) (*dto.AnalisisCumplimientoFicha, error) {
	start, end := rangoDiasFichaEnConsulta(f, desde, hasta)
	if end.Before(start) {
		return nil, nil
	}
	dias := s.calcularCumplimientoDias(f, start, end, sesiones)
	if dias.programados == 0 && dias.resumen.DiasSinFormacion == 0 {
		return nil, nil
	}
	prog, jornada, sede := nombresFichaCumplimiento(f)
	pct := 0.0
	if dias.programados > 0 {
		pct = math.Round(float64(dias.conSesion)/float64(dias.programados)*1000) / 10
	}
	return &dto.AnalisisCumplimientoFicha{
		FichaID:         f.ID,
		FichaNumero:     f.Ficha,
		ProgramaNombre:  prog,
		JornadaNombre:   jornada,
		SedeNombre:      sede,
		DiasProgramados: dias.programados,
		DiasConSesion:   dias.conSesion,
		TotalSesiones:   totalSesiones,
		PctCumplimiento: pct,
		ResumenDetalle:  dias.resumen,
		DetalleDias:     dias.detalle,
	}, nil
}

func mapVinieronPorFicha(rows []repositories.DashboardFichaRow) map[uint]int {
	out := make(map[uint]int, len(rows))
	for _, row := range rows {
		out[row.FichaID] = row.CantidadVinieron
	}
	return out
}

func agregarPorJornadaSemana(
	fichas []models.FichaCaracterizacion,
	d time.Time,
	fichaIDs []uint,
	filtros repositories.AnalisisSesionFiltros,
	s *asistenciaAnalisisService,
	visibles map[uint]int,
	vinieron map[uint]int,
) map[string]struct{ esperados, vinieron int } {
	agg := make(map[string]struct{ esperados, vinieron int })
	for i := range fichas {
		f := &fichas[i]
		if !fichaPasaFiltrosAnalisis(f, d, fichaIDs, filtros.Jornada, filtros.TipoFormacion, s) {
			continue
		}
		esp := visibles[f.ID]
		if esp == 0 {
			continue
		}
		jornadaNombre := ""
		if f.Jornada != nil {
			jornadaNombre = f.Jornada.Nombre
		}
		entry := agg[jornadaNombre]
		entry.esperados += esp
		entry.vinieron += vinieron[f.ID]
		agg[jornadaNombre] = entry
	}
	return agg
}

func filasDesdeAggSemana(fechaStr string, diaID int, agg map[string]struct{ esperados, vinieron int }) (filas []dto.AnalisisDiaSemanaFila, esperados, vinieron int) {
	filas = make([]dto.AnalisisDiaSemanaFila, 0, len(agg))
	for jornadaNombre, v := range agg {
		pct := 0.0
		if v.esperados > 0 {
			pct = math.Round(float64(v.vinieron)/float64(v.esperados)*1000) / 10
		}
		filas = append(filas, dto.AnalisisDiaSemanaFila{
			Fecha:         fechaStr,
			DiaSemanaID:   diaID,
			DiaSemana:     nombresDiaSemana[diaID],
			JornadaNombre: jornadaNombre,
			Esperados:     v.esperados,
			Vinieron:      v.vinieron,
			Pct:           pct,
		})
		esperados += v.esperados
		vinieron += v.vinieron
	}
	return filas, esperados, vinieron
}

func (s *asistenciaAnalisisService) procesarDiaSemanaAnterior(
	d time.Time,
	sedeIDs []uint,
	jornada string,
	fichaIDs []uint,
	estadoFicha string,
	tipoFormacion string,
) (semanaDiaResult, error) {
	diaID := int(WeekdayToDiaFormacionID(d.Weekday()))
	fechaStr := d.Format(time.DateOnly)

	var fichas []models.FichaCaracterizacion
	var err error
	if strings.EqualFold(strings.TrimSpace(estadoFicha), "activas") || strings.TrimSpace(estadoFicha) == "" {
		fichas, err = s.fichaRepo.FindActivasParaFechaConJornada(d, sedeIDUnica(sedeIDs))
	} else {
		fichas, err = s.fichaRepo.FindSolapandoRango(d, d.Add(24*time.Hour), sedeIDs, jornada, false, estadoFicha)
	}
	if err != nil {
		return semanaDiaResult{}, err
	}
	fichas = filtrarFichasPorSedes(fichas, sedeIDs)
	fichas = filtrarFichasPorIDs(fichas, fichaIDs)
	fichas = filtrarFichasPorTipoFormacion(fichas, tipoFormacion)

	fichaIDsDia := make([]uint, 0, len(fichas))
	for i := range fichas {
		if fichaPasaFiltrosAnalisis(&fichas[i], d, nil, jornada, tipoFormacion, s) {
			fichaIDsDia = append(fichaIDsDia, fichas[i].ID)
		}
	}
	if len(fichaIDsDia) == 0 {
		return semanaDiaResult{}, nil
	}

	visibles, err := s.aprendizRepo.CountVisiblesAsistenciaByFichaIDs(fichaIDsDia)
	if err != nil {
		return semanaDiaResult{}, err
	}
	_, porFichaDia, err := s.asistRepo.GetDashboardResumen(sedeIDUnica(sedeIDs), fechaStr)
	if err != nil {
		return semanaDiaResult{}, err
	}

	agg := agregarPorJornadaSemana(fichas, d, nil, repositories.AnalisisSesionFiltros{
		Jornada:       jornada,
		TipoFormacion: tipoFormacion,
	}, s, visibles, mapVinieronPorFicha(porFichaDia))
	filas, diaEsp, diaVin := filasDesdeAggSemana(fechaStr, diaID, agg)
	if diaEsp == 0 {
		return semanaDiaResult{filas: filas}, nil
	}
	pctDia := math.Round(float64(diaVin)/float64(diaEsp)*1000) / 10
	return semanaDiaResult{
		filas: filas,
		ranking: &dto.AnalisisDiaRanking{
			Fecha:       fechaStr,
			DiaSemanaID: diaID,
			DiaSemana:   nombresDiaSemana[diaID],
			Vinieron:    diaVin,
			Pct:         pctDia,
		},
	}, nil
}
