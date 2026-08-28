// Este archivo arma el filtro de auditoría: ficha → tarjetas; persona → carpetas de a 20.
// Lo hice para listar debajo de la lupa sin mezclar el número de ficha con una cédula.
// Lo usa el GET de búsqueda.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/dto"

func busquedaAuditoriaVacia(page int) *dto.LmsAuditoriaBusqueda {
	p := lmsPaginaAuditoria(page)
	return &dto.LmsAuditoriaBusqueda{
		Fichas:   []dto.LmsAulaListItem{},
		Personas: []dto.LmsAuditoriaPersonaItem{},
		Page:     p,
		PageSize: lmsAuditoriaPageSize,
	}
}

func (s *lmsAuditoriaService) Buscar(userID uint, q string, page int) (*dto.LmsAuditoriaBusqueda, error) {
	if _, err := s.exigirAuditoria(userID); err != nil {
		return nil, err
	}
	page = lmsPaginaAuditoria(page)
	texto := lmsTextoAuditoria(q)
	out := busquedaAuditoriaVacia(page)
	if lmsEsNumeroFicha(texto) {
		fichas, errF := s.buscarFichasAuditoria(texto)
		if errF != nil {
			return nil, errF
		}
		if len(fichas) > 0 {
			out.Fichas = fichas
			out.Total = int64(len(fichas))
			return out, nil
		}
	}
	personas, total, errP := s.buscarPersonasAuditoria(texto, page)
	if errP != nil {
		return nil, errP
	}
	out.Personas = personas
	out.Total = total
	return out, nil
}
