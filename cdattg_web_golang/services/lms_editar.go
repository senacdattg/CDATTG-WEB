package services

import (
	"mime/multipart"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// UpdateActividad edita título, descripción, puntos, plazo y agrega archivos.
func (s *lmsAulaService) UpdateActividad(
	userID, fichaID, actividadID uint,
	req dto.LmsActividadRequest,
	files []*multipart.FileHeader,
) (*dto.LmsActividadItem, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirPublicar(user, fichaID, roles); err != nil {
		return nil, err
	}
	row, err := s.actividadDeFicha(fichaID, actividadID)
	if err != nil {
		return nil, err
	}
	if err := aplicarEdicionActividad(row, req, userID); err != nil {
		return nil, err
	}
	if err := errTopeArchivosLMS(len(row.Archivos), len(files)); err != nil {
		return nil, err
	}
	if err := s.actividades.Update(row); err != nil {
		return nil, err
	}
	if err := guardarArchivosActividad(s.actividades, userID, fichaID, row.ID, files); err != nil {
		return nil, err
	}
	return s.itemDeActividad(fichaID, *row), nil
}

// aplicarEdicionActividad actualiza campos editables. No cambia tipo ni habilita_carga.
func aplicarEdicionActividad(row *models.LmsActividad, req dto.LmsActividadRequest, userID uint) error {
	titulo := strings.TrimSpace(req.Titulo)
	if titulo == "" {
		return errTituloObligatorio
	}
	puntos, errPuntos := PuntosActividadLMS(req.CalificacionMax)
	if errPuntos != nil {
		return errPuntos
	}
	uid := userID
	row.Titulo = titulo
	row.Cuerpo = strings.TrimSpace(req.Cuerpo)
	row.CalificacionMax = puntos
	row.PlazoEntrega = req.PlazoEntrega
	row.UserEditID = &uid
	return nil
}
