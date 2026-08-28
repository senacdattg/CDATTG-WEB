// Este archivo oculta compañeros inactivos u ocultos en asistencia.
// Lo hice para que el aprendiz no vea gente que en inasistencia está oculta.
// Lo usa GetAula.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/models"

// aprendicesActivosAula deja solo matriculados activos y visibles en asistencia.
func aprendicesActivosAula(list []models.Aprendiz) []models.Aprendiz {
	out := make([]models.Aprendiz, 0, len(list))
	for i := range list {
		if list[i].Estado && !list[i].OcultoEnAsistencia {
			out = append(out, list[i])
		}
	}
	return out
}
