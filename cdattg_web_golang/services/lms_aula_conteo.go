// Este archivo cuenta cuántos aprendices ya entregaron cada actividad.
// Lo hice para que Trabajos de clase solo liste lo que ya subieron.
// Lo usa GetAula.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func idsDeActividades(acts []models.LmsActividad) []uint {
	ids := make([]uint, len(acts))
	for i := range acts {
		ids[i] = acts[i].ID
	}
	return ids
}

// marcarCantidadEntregas pone cuántos envíos reales tiene cada publicación.
func marcarCantidadEntregas(items []dto.LmsActividadItem, conteos map[uint]int) {
	for i := range items {
		items[i].CantidadEntregas = conteos[items[i].ID]
	}
}

func (s *lmsAulaService) conteoEntregasAula(acts []models.LmsActividad) map[uint]int {
	out := map[uint]int{}
	if len(acts) == 0 {
		return out
	}
	n, err := s.entregas.CountEntregadasByActividadIDs(idsDeActividades(acts))
	if err != nil || n == nil {
		return out
	}
	return n
}
