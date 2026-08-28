// Este archivo lista las carpetas raíz de las personas de una ficha.
// Lo hice para el "Auditar" de la tarjeta: se entra a cada carpeta, no a una tabla.
// Lo usa el GET de personas por ficha.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
)

func (s *lmsAuditoriaService) ListarFicha(userID, fichaID uint) ([]dto.LmsAuditoriaPersonaItem, error) {
	if _, err := s.exigirAuditoria(userID); err != nil {
		return nil, err
	}
	if _, errF := s.fichas.FindByID(fichaID); errF != nil {
		return nil, errors.New("ficha no encontrada")
	}
	list, errL := s.aprendices.FindByFichaID(fichaID)
	if errL != nil {
		return nil, errL
	}
	out := make([]dto.LmsAuditoriaPersonaItem, 0, len(list))
	for i := range list {
		if list[i].Persona == nil {
			continue
		}
		s.asegurarPersonaYFichas(list[i].PersonaID)
		out = append(out, s.itemCarpetaPersona(*list[i].Persona))
	}
	return out, nil
}
