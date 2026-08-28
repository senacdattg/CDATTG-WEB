// Este archivo abre la carpeta raíz y las tres de tipo de formación.
// Lo hice para el "ver más" de auditoría: regular, media técnica y complementaria.
// Lo usa el GET de persona de auditoría.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
)

func (s *lmsAuditoriaService) Persona(userID, personaID uint) (*dto.LmsAuditoriaPersonaDetalle, error) {
	alcance, err := s.exigirAuditoria(userID)
	if err != nil {
		return nil, err
	}
	s.asegurarPersonaYFichas(personaID)
	row, err := s.carpetas.FindPersonaByPersonaID(personaID)
	if err != nil {
		return nil, errors.New("carpeta no encontrada")
	}
	fichas, err := s.carpetas.ListFichasByPersona(personaID)
	if err != nil {
		return nil, err
	}
	item := mapAuditoriaPersona(*row)
	tipos := lmsTiposAuditoria(fichasEnAlcance(fichas, alcance.fichaIDs))
	return &dto.LmsAuditoriaPersonaDetalle{LmsAuditoriaPersonaItem: item, Tipos: tipos}, nil
}
