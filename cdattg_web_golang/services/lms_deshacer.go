package services

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
)

// DeshacerEntrega deja la entrega en borrador para que el aprendiz edite archivos.
func (s *lmsAulaService) DeshacerEntrega(userID, fichaID, actividadID uint) (*dto.LmsEntregaItem, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirEntrar(user, fichaID, roles); err != nil {
		return nil, err
	}
	ap := s.aprendizDeUsuario(user, fichaID)
	if ap == nil {
		return nil, errors.New("solo el aprendiz puede deshacer la entrega")
	}
	if err := exigirEntregaAprendiz(ap); err != nil {
		return nil, err
	}
	act, err := s.actividadDeFicha(fichaID, actividadID)
	if err != nil {
		return nil, err
	}
	row, err := s.entregas.FindByActividadYAprendiz(actividadID, ap.ID)
	if err != nil {
		return nil, errors.New("no hay entrega para deshacer")
	}
	row.EntregadoEn = time.Time{}
	uid := userID
	row.UserEditID = &uid
	if err := s.entregas.Save(row); err != nil {
		return nil, err
	}
	fresh, err := s.entregas.FindByActividadYAprendiz(actividadID, ap.ID)
	if err != nil {
		return nil, err
	}
	item := mapEntregaItem(*fresh, ap, act.PlazoEntrega)
	return &item, nil
}
