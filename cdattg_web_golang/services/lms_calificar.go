package services

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func (s *lmsAulaService) Calificar(
	userID, fichaID, actividadID, entregaID uint,
	req dto.LmsNotaRequest,
) (*dto.LmsEntregaItem, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirPublicar(user, fichaID, roles); err != nil {
		return nil, err
	}
	if err := ValidarNotaLMS(req.Calificacion); err != nil {
		return nil, err
	}
	act, err := s.actividadDeFicha(fichaID, actividadID)
	if err != nil {
		return nil, err
	}
	list, err := s.entregas.FindByActividadID(actividadID)
	if err != nil {
		return nil, err
	}
	var row *models.LmsEntrega
	for i := range list {
		if list[i].ID == entregaID {
			row = &list[i]
			break
		}
	}
	if row == nil {
		return nil, errors.New("entrega no encontrada")
	}
	uid := userID
	row.Calificacion = req.Calificacion
	row.ComentarioInstructor = strings.TrimSpace(req.Comentario)
	row.UserEditID = &uid
	if err := s.entregas.Save(row); err != nil {
		return nil, err
	}
	item := mapEntregaItem(*row, row.Aprendiz, act.PlazoEntrega)
	return &item, nil
}

func (s *lmsAulaService) DescargarArchivoEntrega(
	userID, fichaID, actividadID, entregaID, archivoID uint,
) (*models.LmsEntregaArchivo, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirEntrar(user, fichaID, roles); err != nil {
		return nil, err
	}
	row, err := s.entregas.FindArchivo(fichaID, actividadID, entregaID, archivoID)
	if err != nil {
		return nil, errors.New("archivo no encontrado")
	}
	return row, nil
}

func (s *lmsAulaService) listarEntregasInstructor(fichaID uint, act *models.LmsActividad) []dto.LmsEntregaItem {
	aps, _ := s.aprendices.FindByFichaID(fichaID)
	existentes, _ := s.entregas.FindByActividadID(act.ID)
	porAp := map[uint]models.LmsEntrega{}
	for i := range existentes {
		porAp[existentes[i].AprendizID] = existentes[i]
	}
	out := make([]dto.LmsEntregaItem, 0, len(aps))
	for i := range aps {
		if e, ok := porAp[aps[i].ID]; ok {
			out = append(out, mapEntregaItem(e, &aps[i], act.PlazoEntrega))
			continue
		}
		out = append(out, entregaPendiente(aps[i]))
	}
	return out
}

func mapEntregaItem(e models.LmsEntrega, ap *models.Aprendiz, plazo *time.Time) dto.LmsEntregaItem {
	nombre, doc := "", ""
	if ap != nil && ap.Persona != nil {
		nombre = ap.Persona.GetFullName()
		doc = ap.Persona.NumeroDocumento
	}
	archivos := make([]dto.LmsArchivoItem, 0, len(e.Archivos))
	for i := range e.Archivos {
		archivos = append(archivos, dto.LmsArchivoItem{
			ID: e.Archivos[i].ID, Nombre: e.Archivos[i].NombreOriginal, Tamano: e.Archivos[i].Tamano,
		})
	}
	tardia := EntregaEsTardia(e.EntregadoEn, plazo)
	entregado := ""
	if !e.EntregadoEn.IsZero() {
		entregado = e.EntregadoEn.UTC().Format(time.RFC3339)
	}
	return dto.LmsEntregaItem{
		ID: e.ID, AprendizID: e.AprendizID, AprendizNombre: nombre, Documento: doc,
		EntregadoEn: entregado, Tardia: tardia, Calificacion: e.Calificacion,
		ComentarioInstructor: e.ComentarioInstructor, Archivos: archivos,
	}
}

func entregaPendiente(ap models.Aprendiz) dto.LmsEntregaItem {
	nombre, doc := "", ""
	if ap.Persona != nil {
		nombre = ap.Persona.GetFullName()
		doc = ap.Persona.NumeroDocumento
	}
	return dto.LmsEntregaItem{
		AprendizID: ap.ID, AprendizNombre: nombre, Documento: doc, Archivos: []dto.LmsArchivoItem{},
	}
}
