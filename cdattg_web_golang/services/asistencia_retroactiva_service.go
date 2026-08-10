package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

const (
	prefijoObservacionRetroactiva = "[CARGA RETROACTIVA]"
	maxDiasRetroactivoAsistencia = 30
	motivoAjusteRetroactivo        = "Registro retroactivo por superadministrador"
)

type contextoAsistenciaRetroactiva struct {
	motivo     string
	fecha      time.Time
	ifc        *models.InstructorFichaCaracterizacion
	ficha      *models.FichaCaracterizacion
	horaInicio time.Time
	horaFin    time.Time
}

func (s *asistenciaService) RegistrarAsistenciaRetroactiva(req dto.AsistenciaRetroactivaRequest) (*dto.AsistenciaRetroactivaResponse, error) {
	ctx, err := s.prepararAsistenciaRetroactiva(req)
	if err != nil {
		return nil, err
	}
	asist, err := s.obtenerOCrearSesionRetroactiva(
		ctx.ifc, ctx.fecha, ctx.horaInicio, ctx.horaFin, ctx.motivo,
	)
	if err != nil {
		return nil, err
	}
	registrados, omitidos, err := s.registrarAprendicesRetroactivos(
		asist, ctx.ifc, req.AprendizIDs, req.JustificadosIDs, ctx.horaInicio, ctx.horaFin, ctx.motivo,
	)
	if err != nil {
		return nil, err
	}
	if registrados == 0 && omitidos > 0 {
		return nil, errors.New("todos los aprendices indicados ya tenían registro en esa sesión")
	}
	if err := s.finalizarSesionRetroactiva(asist, ctx.horaFin, ctx.motivo); err != nil {
		return nil, err
	}
	resp, err := s.GetByID(asist.ID)
	if err != nil {
		return nil, err
	}
	return &dto.AsistenciaRetroactivaResponse{
		Asistencia:  *resp,
		Registrados: registrados,
		Omitidos:    omitidos,
	}, nil
}

func (s *asistenciaService) prepararAsistenciaRetroactiva(
	req dto.AsistenciaRetroactivaRequest,
) (*contextoAsistenciaRetroactiva, error) {
	motivo := strings.TrimSpace(req.Motivo)
	if motivo == "" {
		return nil, errors.New("el motivo es obligatorio")
	}
	if len(req.AprendizIDs) == 0 && len(req.JustificadosIDs) == 0 {
		return nil, errors.New("indique al menos un aprendiz presente o con inasistencia justificada")
	}
	fecha, err := time.ParseInLocation(time.DateOnly, req.Fecha, time.Local)
	if err != nil {
		return nil, errors.New(strings.ToLower(errMsgFechaInvalida))
	}
	if err := validarFechaRetroactiva(fecha); err != nil {
		return nil, err
	}
	ifc, err := s.instFichaRepo.FindByID(req.InstructorFichaID)
	if err != nil || ifc == nil {
		return nil, errors.New(errMsgNoEstaCreadoComoInstructor)
	}
	ficha, err := s.cargarFichaRetroactiva(ifc)
	if err != nil {
		return nil, err
	}
	if err := s.validarProgramacionRetroactiva(ifc, fecha); err != nil {
		return nil, err
	}
	horaInicio, horaFin := horasReferenciaJornadaEnDia(ficha, fecha)
	return &contextoAsistenciaRetroactiva{
		motivo:     motivo,
		fecha:      fecha,
		ifc:        ifc,
		ficha:      ficha,
		horaInicio: horaInicio,
		horaFin:    horaFin,
	}, nil
}

func (s *asistenciaService) cargarFichaRetroactiva(
	ifc *models.InstructorFichaCaracterizacion,
) (*models.FichaCaracterizacion, error) {
	ficha := ifc.Ficha
	if ficha == nil || ficha.Jornada == nil {
		fichaCompleta, err := s.fichaRepo.FindByID(ifc.FichaID)
		if err == nil && fichaCompleta != nil {
			ficha = fichaCompleta
		}
	}
	if ficha == nil {
		return nil, errors.New("no se pudo cargar la ficha")
	}
	return ficha, nil
}

func (s *asistenciaService) validarProgramacionRetroactiva(
	ifc *models.InstructorFichaCaracterizacion,
	fecha time.Time,
) error {
	if err := s.horarioSvc.ValidarPuedeTomarAsistencia(ifc.InstructorID, ifc.FichaID, fecha); err != nil {
		return err
	}
	if !s.horarioSvc.calendarioSvc.EsSesionFormacionValida(ifc.FichaID, ifc.InstructorID, fecha) {
		return errors.New("la fecha no corresponde a un día de formación programado para este instructor en la ficha")
	}
	return nil
}

func validarFechaRetroactiva(fecha time.Time) error {
	now := time.Now()
	loc := now.Location()
	inicioHoy := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	inicioFecha := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, loc)
	if !inicioFecha.Before(inicioHoy) {
		return errors.New("la fecha debe ser anterior al día de hoy")
	}
	diffDias := int(inicioHoy.Sub(inicioFecha).Hours() / 24)
	if diffDias > maxDiasRetroactivoAsistencia {
		return fmt.Errorf("solo se permite cargar asistencia hasta %d días atrás", maxDiasRetroactivoAsistencia)
	}
	return nil
}

func horasReferenciaJornadaEnDia(ficha *models.FichaCaracterizacion, dia time.Time) (time.Time, time.Time) {
	var j *models.Jornada
	if ficha != nil {
		j = ficha.Jornada
	}
	horarioSvc := NewInstructorHorarioService()
	diaID := WeekdayToDiaFormacionID(dia.Weekday())
	bloques := horarioSvc.bloquesDiaFicha(ficha, diaID)
	if len(bloques) > 0 {
		hi := normalizeHoraMM(bloques[0].HoraInicio)
		hf := maxHoraFinDeBloques(bloques)
		return instanteHoraEnDia(dia, hi), instanteHoraEnDia(dia, hf)
	}
	if j != nil && strings.TrimSpace(j.HoraInicio) != "" && strings.TrimSpace(j.HoraFin) != "" {
		return instanteHoraEnDia(dia, j.HoraInicio), instanteHoraEnDia(dia, j.HoraFin)
	}
	base := time.Date(dia.Year(), dia.Month(), dia.Day(), 7, 0, 0, 0, dia.Location())
	return base, base.Add(8 * time.Hour)
}

func (s *asistenciaService) obtenerOCrearSesionRetroactiva(
	ifc *models.InstructorFichaCaracterizacion,
	fecha, horaInicio, horaFin time.Time,
	motivo string,
) (*models.Asistencia, error) {
	existente, _ := s.repo.FindByInstructorFichaIDAndFecha(ifc.ID, fecha)
	if existente != nil {
		return existente, nil
	}
	fichaNum := codigoFichaParaSesion(ifc)
	fechaStr := fecha.Format(time.DateOnly)
	ev := models.Evidencia{
		Nombre: fmt.Sprintf("Asistencia Ficha %s %s", fichaNum, fechaStr),
		Codigo: fmt.Sprintf("ASIST-%s-%s", fichaNum, fechaStr),
	}
	if err := s.evidenciaRepo.Create(&ev); err != nil {
		return nil, fmt.Errorf("error al crear evidencia: %w", err)
	}
	hi := horaInicio
	hf := horaFin
	a := models.Asistencia{
		InstructorFichaID: ifc.ID,
		Fecha:             fecha,
		HoraInicio:        &hi,
		HoraFin:           &hf,
		IsFinished:        true,
		EvidenciaID:       &ev.ID,
		Observaciones:     observacionRetroactiva(motivo),
	}
	if err := s.repo.Create(&a); err != nil {
		return nil, fmt.Errorf("error al crear sesión: %w", err)
	}
	return &a, nil
}

func observacionRetroactiva(motivo string) string {
	return fmt.Sprintf("%s Motivo: %s", prefijoObservacionRetroactiva, motivo)
}

func mapEstadosRetroactivos(presentesIDs, justificadosIDs []uint) (map[uint]string, error) {
	vistos := make(map[uint]string, len(presentesIDs)+len(justificadosIDs))
	for _, id := range presentesIDs {
		if id == 0 {
			continue
		}
		vistos[id] = "presente"
	}
	for _, id := range justificadosIDs {
		if id == 0 {
			continue
		}
		if prev, ok := vistos[id]; ok && prev == "presente" {
			return nil, fmt.Errorf("el aprendiz %d no puede marcarse presente y justificado a la vez", id)
		}
		vistos[id] = "justificado"
	}
	return vistos, nil
}

func aplicarEstadoRetroactivoAprendiz(
	aa *models.AsistenciaAprendiz,
	ifcID uint,
	modo string,
	horaInicio, horaFin time.Time,
	motivo string,
) {
	if modo == "presente" {
		hi := horaInicio
		hf := horaFin
		aa.InstructorFichaIDRegistroIngreso = &ifcID
		aa.InstructorFichaIDRegistroSalida = &ifcID
		aa.HoraIngreso = &hi
		aa.HoraSalida = &hf
		aa.Estado = "ASISTENCIA_COMPLETA"
		return
	}
	aa.Observaciones = "Inasistencia justificada (carga retroactiva). " + motivo
}

func (s *asistenciaService) resolverTipoJustificadaRetroactiva(justificadosIDs []uint) (*models.TipoObservacionAsistencia, error) {
	tipoJustificada, errTipo := s.tipoObsRepo.FindByCodigo("INASISTENCIA_JUSTIFICADA")
	if errTipo == nil && tipoJustificada != nil {
		return tipoJustificada, nil
	}
	if len(justificadosIDs) > 0 {
		return nil, errors.New("no está configurado el tipo de observación «Inasistencia justificada»")
	}
	return nil, nil
}

type registroRetroactivoCtx struct {
	asist           *models.Asistencia
	fichaID         uint
	ifcID           uint
	horaInicio      time.Time
	horaFin         time.Time
	motivo          string
	motivoAjuste    string
	tipoJustificada *models.TipoObservacionAsistencia
}

func (s *asistenciaService) registrarUnAprendizRetroactivo(
	ctx registroRetroactivoCtx,
	aprendizID uint,
	modo string,
) (omitido bool, err error) {
	if err := s.validarAprendizEnFicha(ctx.fichaID, aprendizID); err != nil {
		return false, err
	}
	if err := s.validarAprendizPuedeTomarAsistencia(aprendizID); err != nil {
		return false, err
	}
	previo, _ := s.repoAA.FindByAsistenciaIDAndAprendizID(ctx.asist.ID, aprendizID)
	if previo != nil {
		return true, nil
	}

	ifcID := ctx.ifcID
	aa := models.AsistenciaAprendiz{
		AsistenciaID:      ctx.asist.ID,
		InstructorFichaID: &ifcID,
		AprendizFichaID:   aprendizID,
		RequiereRevision:  false,
		MotivoAjuste:      ctx.motivoAjuste,
	}
	aplicarEstadoRetroactivoAprendiz(&aa, ifcID, modo, ctx.horaInicio, ctx.horaFin, ctx.motivo)
	if err := s.repoAA.Create(&aa); err != nil {
		return false, fmt.Errorf("error al registrar aprendiz %d: %w", aprendizID, err)
	}
	if err := s.aplicarTipoJustificadaRetroactiva(&aa, modo, ctx.tipoJustificada, aprendizID); err != nil {
		return false, err
	}
	return false, nil
}

func (s *asistenciaService) aplicarTipoJustificadaRetroactiva(
	aa *models.AsistenciaAprendiz,
	modo string,
	tipoJustificada *models.TipoObservacionAsistencia,
	aprendizID uint,
) error {
	if modo != "justificado" || tipoJustificada == nil {
		return nil
	}
	if err := s.repoAA.ReplaceTiposObservacion(aa, []models.TipoObservacionAsistencia{*tipoJustificada}); err != nil {
		return fmt.Errorf("error al marcar justificación del aprendiz %d: %w", aprendizID, err)
	}
	return nil
}

func (s *asistenciaService) registrarAprendicesRetroactivos(
	asist *models.Asistencia,
	ifc *models.InstructorFichaCaracterizacion,
	presentesIDs, justificadosIDs []uint,
	horaInicio, horaFin time.Time,
	motivo string,
) (registrados, omitidos int, err error) {
	tipoJustificada, errTipo := s.resolverTipoJustificadaRetroactiva(justificadosIDs)
	if errTipo != nil {
		return 0, 0, errTipo
	}
	vistos, errMap := mapEstadosRetroactivos(presentesIDs, justificadosIDs)
	if errMap != nil {
		return 0, 0, errMap
	}

	ctx := registroRetroactivoCtx{
		asist:           asist,
		fichaID:         ifc.FichaID,
		ifcID:           ifc.ID,
		horaInicio:      horaInicio,
		horaFin:         horaFin,
		motivo:          motivo,
		motivoAjuste:    fmt.Sprintf("%s. %s", motivoAjusteRetroactivo, motivo),
		tipoJustificada: tipoJustificada,
	}
	for aprendizID, modo := range vistos {
		omitido, errReg := s.registrarUnAprendizRetroactivo(ctx, aprendizID, modo)
		if errReg != nil {
			return registrados, omitidos, errReg
		}
		if omitido {
			omitidos++
			continue
		}
		registrados++
	}
	return registrados, omitidos, nil
}

func (s *asistenciaService) validarAprendizEnFicha(fichaID, aprendizID uint) error {
	a, err := s.aprendizRepo.FindByID(aprendizID)
	if err != nil || a == nil {
		return errors.New("aprendiz no encontrado")
	}
	if a.FichaCaracterizacionID != fichaID {
		return errors.New("el aprendiz no pertenece a la ficha indicada")
	}
	return nil
}

func (s *asistenciaService) finalizarSesionRetroactiva(asist *models.Asistencia, horaFin time.Time, motivo string) error {
	actual, err := s.repo.FindByID(asist.ID)
	if err != nil || actual == nil {
		return errors.New(errMsgSesionAsistenciaNoEncontrada)
	}
	hf := horaFin
	actual.HoraFin = &hf
	actual.IsFinished = true
	nota := observacionRetroactiva(motivo)
	if strings.Contains(actual.Observaciones, prefijoObservacionRetroactiva) {
		if !strings.Contains(actual.Observaciones, motivo) {
			actual.Observaciones = actual.Observaciones + "\n" + nota
		}
	} else if strings.TrimSpace(actual.Observaciones) == "" {
		actual.Observaciones = nota
	} else {
		actual.Observaciones = actual.Observaciones + "\n" + nota
	}
	return s.repo.Update(actual)
}
