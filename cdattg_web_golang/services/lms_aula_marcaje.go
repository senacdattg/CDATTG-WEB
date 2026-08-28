// Este archivo marca si el aprendiz ya entregó cada actividad y filtra
// compañeros ocultos en asistencia. Lo hice porque el aula mezcla pendientes
// y entregados, y el aprendiz veía gente que en inasistencia está oculta.
// Lo usa GetAula; se relaciona con LmsAulaAprendices y las pestañas del aula.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// aprendicesActivosAula deja solo matriculados activos y visibles en asistencia.
// Lo uso en el aula del aprendiz: no debe ver a los ocultos en inasistencia.
func aprendicesActivosAula(list []models.Aprendiz) []models.Aprendiz {
	out := make([]models.Aprendiz, 0, len(list))
	for i := range list {
		if list[i].Estado && !list[i].OcultoEnAsistencia {
			out = append(out, list[i])
		}
	}
	return out
}

// marcarActividadesEntregadas pone entregada=true si el aprendiz ya envió el trabajo.
func marcarActividadesEntregadas(items []dto.LmsActividadItem, entregadas map[uint]bool) {
	for i := range items {
		items[i].Entregada = entregadas[items[i].ID]
	}
}

// idsEntregadasDeAprendiz actividades de la ficha que este usuario ya entregó.
func (s *lmsAulaService) idsEntregadasDeAprendiz(
	user *models.User,
	fichaID uint,
	acts []models.LmsActividad,
) map[uint]bool {
	out := make(map[uint]bool)
	ap := s.aprendizDeUsuario(user, fichaID)
	if ap == nil || len(acts) == 0 {
		return out
	}
	list, err := s.entregas.FindByAprendizYActividades(ap.ID, idsDeActividades(acts))
	if err != nil {
		return out
	}
	for i := range list {
		if !list[i].EntregadoEn.IsZero() {
			out[list[i].ActividadID] = true
		}
	}
	return out
}
