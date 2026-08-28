package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/models"
)

// DescargarArchivo valida acceso al aula y localiza el adjunto.
func (s *lmsAulaService) DescargarArchivo(
	userID, fichaID, actividadID, archivoID uint,
) (*models.LmsActividadArchivo, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirEntrar(user, fichaID, roles); err != nil {
		return nil, err
	}
	if _, err := s.actividadVisibleEnFicha(user, fichaID, actividadID, roles); err != nil {
		return nil, err
	}
	row, err := s.actividades.FindArchivo(fichaID, actividadID, archivoID)
	if err != nil {
		return nil, errors.New("archivo no encontrado")
	}
	return row, nil
}
