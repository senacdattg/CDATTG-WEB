// Este archivo busca fichas para mostrarlas como tarjeta en auditoría.
// Lo hice para que al filtrar por número de ficha se vea igual que Mis aulas.
// Lo usa Buscar cuando el texto es solo dígitos.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/dto"

func (s *lmsAuditoriaService) buscarFichasAuditoria(texto string) ([]dto.LmsAulaListItem, error) {
	rows, _, err := s.fichas.FindAll(1, 20, nil, nil, texto, "")
	if err != nil {
		return nil, err
	}
	ids := make([]uint, len(rows))
	for i := range rows {
		ids[i] = rows[i].ID
	}
	conteos, _ := s.aprendices.CountActivosByFichaIDs(ids)
	out := make([]dto.LmsAulaListItem, 0, len(rows))
	for i := range rows {
		out = append(out, mapFichaAAulaItem(rows[i], conteos[rows[i].ID], false))
	}
	return out, nil
}
