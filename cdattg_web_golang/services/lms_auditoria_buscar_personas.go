// Este archivo busca personas registradas y les arma la carpeta raíz si no la tenían.
// Lo hice porque la auditoría debe listar de a 20, no de un golpe.
// Lo usa Buscar.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func (s *lmsAuditoriaService) buscarPersonasAuditoria(texto string, page int) ([]dto.LmsAuditoriaPersonaItem, int64, error) {
	list, total, err := s.personas.FindAll(page, lmsAuditoriaPageSize, texto)
	if err != nil {
		return nil, 0, err
	}
	out := make([]dto.LmsAuditoriaPersonaItem, 0, len(list))
	for i := range list {
		s.asegurarPersonaYFichas(list[i].ID)
		out = append(out, s.itemCarpetaPersona(list[i]))
	}
	return out, total, nil
}

func (s *lmsAuditoriaService) itemCarpetaPersona(p models.Persona) dto.LmsAuditoriaPersonaItem {
	row, err := s.carpetas.FindPersonaByPersonaID(p.ID)
	if err != nil {
		return mapPersonaAItem(p)
	}
	return mapAuditoriaPersona(*row)
}
