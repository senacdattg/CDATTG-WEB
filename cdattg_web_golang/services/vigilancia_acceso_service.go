package services

import (
	"errors"
	"strings"
	"time"
	"unicode"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

const (
	metodoLaser  = "LASER"
	metodoCamara = "CAMARA"
	metodoManual = "MANUAL"

	tipoAprendiz       = "APRENDIZ"
	tipoInstructor     = "INSTRUCTOR"
	tipoAdministrativo = "ADMINISTRATIVO"
	tipoVisitante      = "VISITANTE"

	accionIngreso = "INGRESO"
	accionSalida  = "SALIDA"

	modoEntrada = "ENTRADA"
	modoSalida  = "SALIDA"

	errDocObligatorio  = "número de documento obligatorio"
	errSedeObligatoria = "debe seleccionar la sede antes de escanear o registrar"
)

var tiposPersonaAcceso = []string{tipoAprendiz, tipoInstructor, tipoAdministrativo, tipoVisitante}

var motivosSalidaAcceso = []string{
	"DESCANSO",
	"CAFETERIA",
	"FIN_JORNADA",
	"CITA_MEDICA",
	"NOVEDAD_FAMILIAR",
	"COMISION_INSTITUCIONAL",
	"OTRO",
}

// VigilanciaAccesoService lógica de portería (ingreso/salida sede).
type VigilanciaAccesoService interface {
	Lookup(req dto.AccesoLookupRequest) (*dto.AccesoLookupResponse, error)
	Ingreso(req dto.AccesoIngresoRequest, registradoPorUserID uint) (*dto.AccesoRegistroResponse, error)
	Salida(req dto.AccesoSalidaRequest, registradoPorUserID uint) (*dto.AccesoRegistroResponse, error)
	ListDentro(sedeID *uint) ([]dto.AccesoDentroItem, error)
	Historial(f dto.AccesoHistorialFiltros) (*dto.AccesoHistorialResponse, error)
	Estadisticas(f dto.AccesoHistorialFiltros) (*dto.AccesoEstadisticasResponse, error)
}

type vigilanciaAccesoService struct {
	personaRepo    repositories.PersonaRepository
	accesoRepo     repositories.PersonaIngresoSalidaRepository
	catalogo       repositories.CatalogoRepository
	userAccounts   PersonaUserAccountService
	instructorRepo repositories.InstructorRepository
	aprendizRepo   repositories.AprendizRepository
	fichaRepo      repositories.FichaRepository
}

// NewVigilanciaAccesoService construye el servicio de portería.
func NewVigilanciaAccesoService() VigilanciaAccesoService {
	userRepo := repositories.NewUserRepository()
	return &vigilanciaAccesoService{
		personaRepo:    repositories.NewPersonaRepository(),
		accesoRepo:     repositories.NewPersonaIngresoSalidaRepository(),
		catalogo:       repositories.NewCatalogoRepository(),
		userAccounts:   NewPersonaUserAccountService(userRepo),
		instructorRepo: repositories.NewInstructorRepository(),
		aprendizRepo:   repositories.NewAprendizRepository(),
		fichaRepo:      repositories.NewFichaRepository(),
	}
}

func normalizeDocumentoAcceso(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}
	var b strings.Builder
	for _, r := range trimmed {
		if unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	digits := b.String()
	if len(digits) >= 5 {
		return digits
	}
	return trimmed
}

func normalizeMetodo(m string) (string, error) {
	switch strings.ToUpper(strings.TrimSpace(m)) {
	case metodoLaser, "QR", "ESCANER":
		return metodoLaser, nil
	case metodoCamara, "CAMERA", "CAM":
		return metodoCamara, nil
	case metodoManual, "":
		return metodoManual, nil
	default:
		return "", errors.New("método de registro inválido (use LASER, CAMARA o MANUAL)")
	}
}

func normalizeTipoPersona(t string) (string, error) {
	v := strings.ToUpper(strings.TrimSpace(t))
	for _, ok := range tiposPersonaAcceso {
		if v == ok {
			return v, nil
		}
	}
	return "", errors.New("tipo de persona inválido")
}

func normalizeMotivoSalida(m string) (string, error) {
	v := strings.ToUpper(strings.TrimSpace(m))
	for _, ok := range motivosSalidaAcceso {
		if v == ok {
			return v, nil
		}
	}
	return "", errors.New("motivo de salida inválido")
}

func normalizeModo(m string) string {
	switch strings.ToUpper(strings.TrimSpace(m)) {
	case modoEntrada, accionIngreso:
		return modoEntrada
	case modoSalida: // SALIDA (mismo valor que accionSalida)
		return modoSalida
	default:
		return ""
	}
}

// PersonaEsStubPorteria indica alta automática de portería: solo documento, sin datos personales.
func PersonaEsStubPorteria(p *models.Persona) bool {
	if p == nil {
		return false
	}
	if strings.TrimSpace(p.NumeroDocumento) == "" {
		return false
	}
	if strings.TrimSpace(p.PrimerNombre) != "" || strings.TrimSpace(p.PrimerApellido) != "" {
		return false
	}
	if strings.TrimSpace(p.SegundoNombre) != "" || strings.TrimSpace(p.SegundoApellido) != "" {
		return false
	}
	if strings.TrimSpace(p.Email) != "" || strings.TrimSpace(p.Celular) != "" || strings.TrimSpace(p.Telefono) != "" {
		return false
	}
	if p.TipoDocumentoID != nil && *p.TipoDocumentoID != 0 {
		return false
	}
	return true
}

// PersonaPerfilCompleto es false solo para stubs de portería (documento y nada más).
func PersonaPerfilCompleto(p *models.Persona) bool {
	return !PersonaEsStubPorteria(p)
}

// CamposFaltantesPerfil lista campos sugeridos solo cuando es stub de portería.
func CamposFaltantesPerfil(p *models.Persona) []string {
	if !PersonaEsStubPorteria(p) {
		return nil
	}
	return []string{"primer_nombre", "primer_apellido", "tipo_documento", "email_o_celular"}
}

func (s *vigilanciaAccesoService) requireSedeID(sedeID *uint) (uint, error) {
	if sedeID == nil || *sedeID == 0 {
		return 0, errors.New(errSedeObligatoria)
	}
	sedes, err := s.catalogo.FindSedes()
	if err != nil {
		return 0, err
	}
	for i := range sedes {
		if sedes[i].ID == *sedeID {
			return *sedeID, nil
		}
	}
	return 0, errors.New("sede no encontrada o inactiva")
}

func (s *vigilanciaAccesoService) sugerirTipoPersona(personaID uint) string {
	if inst, err := s.instructorRepo.FindByPersonaID(personaID); err == nil && inst != nil {
		return tipoInstructor
	}
	if apr, err := s.aprendizRepo.FindByPersonaID(personaID); err == nil && apr != nil {
		return tipoAprendiz
	}
	return tipoVisitante
}

// resolveFichaActiva devuelve la ficha del aprendiz solo si la matrícula está activa y la ficha status=true.
// Si la ficha está inactiva o no hay relación, retorna nil (no se muestra al vigilante).
func (s *vigilanciaAccesoService) resolveFichaActiva(personaID uint) *dto.AccesoFichaResumen {
	apr, err := s.aprendizRepo.FindActivoByPersonaID(personaID)
	if err != nil || apr == nil || apr.FichaCaracterizacionID == 0 {
		return nil
	}
	ficha, err := s.fichaRepo.FindByID(apr.FichaCaracterizacionID)
	if err != nil || ficha == nil || !ficha.Status {
		return nil
	}
	if !config.IgnorarVigenciaFicha() {
		hoy := time.Now()
		if ficha.FechaFin != nil && ficha.FechaFin.Before(hoy.Truncate(24*time.Hour)) {
			return nil
		}
		if ficha.FechaInicio != nil && ficha.FechaInicio.After(hoy) {
			return nil
		}
	}
	res := &dto.AccesoFichaResumen{
		ID:     ficha.ID,
		Numero: ficha.Ficha,
		Activa: true,
	}
	if ficha.ProgramaFormacion != nil {
		res.ProgramaNombre = ficha.ProgramaFormacion.Nombre
	}
	if ficha.Jornada != nil {
		res.JornadaNombre = ficha.Jornada.Nombre
	}
	if ficha.Sede != nil {
		res.SedeNombre = ficha.Sede.Nombre
	}
	return res
}

func toFicha(p *models.Persona, esNueva bool, tipoSugerido string) dto.AccesoPersonaFicha {
	return dto.AccesoPersonaFicha{
		PersonaID:       p.ID,
		NumeroDocumento: p.NumeroDocumento,
		TipoDocumentoID: p.TipoDocumentoID,
		PrimerNombre:    p.PrimerNombre,
		SegundoNombre:   p.SegundoNombre,
		PrimerApellido:  p.PrimerApellido,
		SegundoApellido: p.SegundoApellido,
		NombreCompleto:  strings.TrimSpace(p.GetFullName()),
		Email:           p.Email,
		Celular:         p.Celular,
		Telefono:        p.Telefono,
		EsNueva:         esNueva,
		PerfilCompleto:  PersonaPerfilCompleto(p),
		TipoSugerido:    tipoSugerido,
	}
}

func visitaDTO(v *models.PersonaIngresoSalida) *dto.AccesoVisitaAbierta {
	if v == nil {
		return nil
	}
	return &dto.AccesoVisitaAbierta{
		ID:               v.ID,
		TipoPersona:      v.TipoPersona,
		TimestampEntrada: v.TimestampEntrada.Format(time.RFC3339),
		MetodoRegistro:   v.MetodoRegistro,
	}
}

func (s *vigilanciaAccesoService) findOrCreatePersona(doc string) (*models.Persona, bool, error) {
	persona, err := s.personaRepo.FindByNumeroDocumento(doc)
	if err == nil && persona != nil {
		return persona, false, nil
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		if !strings.Contains(strings.ToLower(err.Error()), "record not found") {
			return nil, false, err
		}
	}

	nueva := models.Persona{
		NumeroDocumento: doc,
		Status:          true,
	}
	if err := s.personaRepo.Create(&nueva); err != nil {
		return nil, false, err
	}
	if err := s.userAccounts.CreateForPersona(nueva); err != nil {
		return nil, false, err
	}
	return &nueva, true, nil
}

func (s *vigilanciaAccesoService) Lookup(req dto.AccesoLookupRequest) (*dto.AccesoLookupResponse, error) {
	doc := normalizeDocumentoAcceso(req.NumeroDocumento)
	if doc == "" {
		return nil, errors.New(errDocObligatorio)
	}
	sedeID, err := s.requireSedeID(req.SedeID)
	if err != nil {
		return nil, err
	}

	persona, esNueva, err := s.findOrCreatePersona(doc)
	if err != nil {
		return nil, err
	}

	tipoSug := s.sugerirTipoPersona(persona.ID)
	abierta, err := s.accesoRepo.FindAbiertaByPersonaAndSede(persona.ID, sedeID)
	dentro := false
	var visita *dto.AccesoVisitaAbierta
	if err == nil && abierta != nil {
		dentro = true
		visita = visitaDTO(abierta)
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	modo := normalizeModo(req.Modo)
	accion := accionIngreso
	if dentro {
		accion = accionSalida
	}
	puede := true
	alerta := ""
	permiteSinIngreso := false

	switch modo {
	case modoEntrada:
		accion = accionIngreso
		if dentro {
			puede = false
			alerta = "La persona ya tiene un ingreso abierto en esta sede. Registre la salida antes de un nuevo ingreso."
		}
	case modoSalida:
		accion = accionSalida
		if !dentro {
			puede = false
			permiteSinIngreso = true
			alerta = "No hay ingreso registrado. El sistema no puede saber si está adentro físicamente; puede registrar una salida irregular (sin ingreso previo)."
		}
	}

	return &dto.AccesoLookupResponse{
		Persona:                 toFicha(persona, esNueva, tipoSug),
		Dentro:                  dentro,
		AccionSugerida:          accion,
		VisitaAbierta:           visita,
		Ficha:                   s.resolveFichaActiva(persona.ID),
		SedeID:                  sedeID,
		TiposPersona:            append([]string{}, tiposPersonaAcceso...),
		MotivosSalida:           append([]string{}, motivosSalidaAcceso...),
		PuedeConfirmar:          puede,
		Alerta:                  alerta,
		PermiteSalidaSinIngreso: permiteSinIngreso,
	}, nil
}

func (s *vigilanciaAccesoService) Ingreso(req dto.AccesoIngresoRequest, registradoPorUserID uint) (*dto.AccesoRegistroResponse, error) {
	doc := normalizeDocumentoAcceso(req.NumeroDocumento)
	if doc == "" {
		return nil, errors.New(errDocObligatorio)
	}
	tipo, err := normalizeTipoPersona(req.TipoPersona)
	if err != nil {
		return nil, err
	}
	metodo, err := normalizeMetodo(req.MetodoRegistro)
	if err != nil {
		return nil, err
	}
	sedeID, err := s.requireSedeID(req.SedeID)
	if err != nil {
		return nil, err
	}

	persona, esNueva, err := s.findOrCreatePersona(doc)
	if err != nil {
		return nil, err
	}

	if abierta, err := s.accesoRepo.FindAbiertaByPersonaAndSede(persona.ID, sedeID); err == nil && abierta != nil {
		return nil, errors.New("la persona ya tiene un ingreso abierto; registre la salida primero")
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	now := time.Now()
	regID := registradoPorUserID
	fichaInfo := s.resolveFichaActiva(persona.ID)
	row := &models.PersonaIngresoSalida{
		PersonaID:           persona.ID,
		SedeID:              sedeID,
		TipoPersona:         tipo,
		FechaEntrada:        now,
		HoraEntrada:         now,
		TimestampEntrada:    now,
		Observaciones:       strings.TrimSpace(req.Observaciones),
		MetodoRegistro:      metodo,
		RegistradoPorUserID: &regID,
	}
	if fichaInfo != nil {
		fid := fichaInfo.ID
		row.FichaCaracterizacionID = &fid
	}
	if err := s.accesoRepo.Create(row); err != nil {
		return nil, err
	}

	msg := "Ingreso registrado."
	if esNueva {
		msg = "Persona nueva creada e ingreso registrado. Deberá completar sus datos al entrar al sistema."
	}

	return &dto.AccesoRegistroResponse{
		Persona:       toFicha(persona, esNueva, tipo),
		Accion:        accionIngreso,
		VisitaID:      row.ID,
		Dentro:        true,
		Mensaje:       msg,
		VisitaAbierta: visitaDTO(row),
		Ficha:         fichaInfo,
		SedeID:        sedeID,
	}, nil
}

func (s *vigilanciaAccesoService) resolvePersonaParaSalida(doc string, permitirSinIngreso bool) (*models.Persona, error) {
	persona, err := s.personaRepo.FindByNumeroDocumento(doc)
	if err == nil && persona != nil {
		return persona, nil
	}
	if !permitirSinIngreso {
		return nil, errors.New("persona no encontrada; no hay ingreso abierto para ese documento")
	}
	persona, _, err = s.findOrCreatePersona(doc)
	return persona, err
}

func (s *vigilanciaAccesoService) crearSalidaSinIngreso(
	persona *models.Persona,
	sedeID uint,
	motivo, observacion, metodo string,
	tipoPersona string,
	registradoPorUserID uint,
) (*dto.AccesoRegistroResponse, error) {
	tipo, errTipo := normalizeTipoPersona(tipoPersona)
	if errTipo != nil {
		tipo = s.sugerirTipoPersona(persona.ID)
	}
	now := time.Now()
	regID := registradoPorUserID
	obs := strings.TrimSpace(observacion)
	if obs == "" {
		obs = "Salida registrada sin ingreso previo"
	}
	row := &models.PersonaIngresoSalida{
		PersonaID:           persona.ID,
		SedeID:              sedeID,
		TipoPersona:         tipo,
		FechaEntrada:        now,
		HoraEntrada:         now,
		TimestampEntrada:    now,
		FechaSalida:         &now,
		HoraSalida:          &now,
		TimestampSalida:     &now,
		Observaciones:       "salida_sin_ingreso=true",
		MetodoRegistro:      metodo,
		RegistradoPorUserID: &regID,
		MotivoSalida:        motivo,
		ObservacionSalida:   obs,
		SalidaSinIngreso:    true,
	}
	if err := s.accesoRepo.Create(row); err != nil {
		return nil, err
	}
	return &dto.AccesoRegistroResponse{
		Persona:          toFicha(persona, false, tipo),
		Accion:           accionSalida,
		VisitaID:         row.ID,
		Dentro:           false,
		Mensaje:          "Salida irregular registrada (sin ingreso previo).",
		Ficha:            s.resolveFichaActiva(persona.ID),
		SedeID:           sedeID,
		SalidaSinIngreso: true,
	}, nil
}

func (s *vigilanciaAccesoService) Salida(req dto.AccesoSalidaRequest, registradoPorUserID uint) (*dto.AccesoRegistroResponse, error) {
	doc := normalizeDocumentoAcceso(req.NumeroDocumento)
	if doc == "" {
		return nil, errors.New(errDocObligatorio)
	}
	motivo, err := normalizeMotivoSalida(req.MotivoSalida)
	if err != nil {
		return nil, err
	}
	if motivo == "OTRO" && strings.TrimSpace(req.ObservacionSalida) == "" {
		return nil, errors.New("debe indicar una observación cuando el motivo es OTRO")
	}
	metodo, err := normalizeMetodo(req.MetodoRegistro)
	if err != nil {
		return nil, err
	}
	sedeID, err := s.requireSedeID(req.SedeID)
	if err != nil {
		return nil, err
	}

	persona, err := s.resolvePersonaParaSalida(doc, req.PermitirSinIngreso)
	if err != nil {
		return nil, err
	}

	abierta, err := s.accesoRepo.FindAbiertaByPersonaAndSede(persona.ID, sedeID)
	if err == nil && abierta != nil {
		return s.cerrarVisita(abierta, persona, motivo, req.ObservacionSalida, metodo, registradoPorUserID, sedeID)
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if !req.PermitirSinIngreso {
		return nil, errors.New("no hay un ingreso abierto para esta persona")
	}
	return s.crearSalidaSinIngreso(persona, sedeID, motivo, req.ObservacionSalida, metodo, req.TipoPersona, registradoPorUserID)
}

func (s *vigilanciaAccesoService) cerrarVisita(
	abierta *models.PersonaIngresoSalida,
	persona *models.Persona,
	motivo, observacion, metodo string,
	registradoPorUserID, sedeID uint,
) (*dto.AccesoRegistroResponse, error) {
	now := time.Now()
	abierta.FechaSalida = &now
	abierta.HoraSalida = &now
	abierta.TimestampSalida = &now
	abierta.MotivoSalida = motivo
	abierta.ObservacionSalida = strings.TrimSpace(observacion)
	regID := registradoPorUserID
	abierta.RegistradoPorUserID = &regID
	if metodo != "" && metodo != abierta.MetodoRegistro {
		extra := "salida_metodo=" + metodo
		if abierta.Observaciones == "" {
			abierta.Observaciones = extra
		} else {
			abierta.Observaciones = abierta.Observaciones + "; " + extra
		}
	}
	if err := s.accesoRepo.Update(abierta); err != nil {
		return nil, err
	}

	return &dto.AccesoRegistroResponse{
		Persona:  toFicha(persona, false, abierta.TipoPersona),
		Accion:   accionSalida,
		VisitaID: abierta.ID,
		Dentro:   false,
		Mensaje:  "Salida registrada.",
		Ficha:    s.resolveFichaActiva(persona.ID),
		SedeID:   sedeID,
	}, nil
}

func (s *vigilanciaAccesoService) ListDentro(sedeID *uint) ([]dto.AccesoDentroItem, error) {
	sid, err := s.requireSedeID(sedeID)
	if err != nil {
		return nil, err
	}
	rows, err := s.accesoRepo.ListAbiertasBySede(sid)
	if err != nil {
		return nil, err
	}
	out := make([]dto.AccesoDentroItem, 0, len(rows))
	for i := range rows {
		row := rows[i]
		var ficha dto.AccesoPersonaFicha
		if row.Persona != nil {
			ficha = toFicha(row.Persona, false, row.TipoPersona)
		} else {
			p, errP := s.personaRepo.FindByID(row.PersonaID)
			if errP == nil && p != nil {
				ficha = toFicha(p, false, row.TipoPersona)
			}
		}
		out = append(out, dto.AccesoDentroItem{
			VisitaID:         row.ID,
			Persona:          ficha,
			TipoPersona:      row.TipoPersona,
			TimestampEntrada: row.TimestampEntrada.Format(time.RFC3339),
			MetodoRegistro:   row.MetodoRegistro,
		})
	}
	return out, nil
}

func parseFechaDia(s string) (*time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	t, err := time.ParseInLocation("2006-01-02", s, time.Local)
	if err != nil {
		return nil, errors.New("fecha inválida (use YYYY-MM-DD)")
	}
	return &t, nil
}

func (s *vigilanciaAccesoService) toRepoQuery(f dto.AccesoHistorialFiltros) (repositories.AccesoHistorialQuery, error) {
	desde, err := parseFechaDia(f.FechaDesde)
	if err != nil {
		return repositories.AccesoHistorialQuery{}, err
	}
	hasta, err := parseFechaDia(f.FechaHasta)
	if err != nil {
		return repositories.AccesoHistorialQuery{}, err
	}
	return repositories.AccesoHistorialQuery{
		RegionalID:       f.RegionalID,
		SedeID:           f.SedeID,
		FechaDesde:       desde,
		FechaHasta:       hasta,
		TipoPersona:      f.TipoPersona,
		Documento:        f.Documento,
		Estado:           f.Estado,
		SalidaSinIngreso: f.SalidaSinIngreso,
		Page:             f.Page,
		PageSize:         f.PageSize,
	}, nil
}

func historialItemFromRow(row *models.PersonaIngresoSalida) dto.AccesoHistorialItem {
	estado := "abierto"
	var tsSalida *string
	if row.TimestampSalida != nil {
		estado = "cerrado"
		v := row.TimestampSalida.Format(time.RFC3339)
		tsSalida = &v
	}
	item := dto.AccesoHistorialItem{
		VisitaID:          row.ID,
		TipoPersona:       row.TipoPersona,
		SedeID:            row.SedeID,
		TimestampEntrada:  row.TimestampEntrada.Format(time.RFC3339),
		TimestampSalida:   tsSalida,
		MetodoRegistro:    row.MetodoRegistro,
		MotivoSalida:      row.MotivoSalida,
		ObservacionSalida: row.ObservacionSalida,
		SalidaSinIngreso:  row.SalidaSinIngreso,
		Estado:            estado,
	}
	if row.Persona != nil {
		item.Persona = toFicha(row.Persona, false, row.TipoPersona)
	}
	if row.Sede != nil {
		item.SedeNombre = row.Sede.Nombre
		item.RegionalID = row.Sede.RegionalID
		if row.Sede.Regional != nil {
			item.RegionalNombre = row.Sede.Regional.Nombre
		}
	}
	return item
}

func (s *vigilanciaAccesoService) Historial(f dto.AccesoHistorialFiltros) (*dto.AccesoHistorialResponse, error) {
	q, err := s.toRepoQuery(f)
	if err != nil {
		return nil, err
	}
	rows, total, err := s.accesoRepo.ListHistorial(q)
	if err != nil {
		return nil, err
	}
	items := make([]dto.AccesoHistorialItem, 0, len(rows))
	for i := range rows {
		items = append(items, historialItemFromRow(&rows[i]))
	}
	page := q.Page
	if page < 1 {
		page = 1
	}
	size := q.PageSize
	if size < 1 {
		size = 25
	}
	return &dto.AccesoHistorialResponse{
		Items:      items,
		Total:      total,
		Page:       page,
		PageSize:   size,
		FechaDesde: f.FechaDesde,
		FechaHasta: f.FechaHasta,
	}, nil
}

func (s *vigilanciaAccesoService) Estadisticas(f dto.AccesoHistorialFiltros) (*dto.AccesoEstadisticasResponse, error) {
	q, err := s.toRepoQuery(f)
	if err != nil {
		return nil, err
	}
	ingresos, salidas, abiertas, cerradas, sinIngreso, porTipo, porMotivo, porMetodo, err := s.accesoRepo.StatsHistorial(q)
	if err != nil {
		return nil, err
	}
	dentroAhora, err := s.accesoRepo.CountAbiertasBySede(f.SedeID, f.RegionalID)
	if err != nil {
		return nil, err
	}
	return &dto.AccesoEstadisticasResponse{
		FechaDesde:             f.FechaDesde,
		FechaHasta:             f.FechaHasta,
		TotalIngresos:          ingresos,
		TotalSalidas:           salidas,
		DentroAhora:            dentroAhora,
		SalidasSinIngreso:      sinIngreso,
		VisitasAbiertasPeriodo: abiertas,
		VisitasCerradasPeriodo: cerradas,
		PorTipoPersona:         porTipo,
		PorMotivoSalida:        porMotivo,
		PorMetodo:              porMetodo,
	}, nil
}
