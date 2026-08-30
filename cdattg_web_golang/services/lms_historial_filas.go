// Este archivo arma las filas del historial: aprendiz, título y nota.
// Lo hice para que el instructor vea a todos de la ficha en una tabla.
// Lo usa HistorialCalificaciones.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"sort"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// armarFilasHistorial cruza aprendices con actividades y pone la nota si existe.
func armarFilasHistorial(
	aps []models.Aprendiz,
	acts []models.LmsActividad,
	ents []models.LmsEntrega,
) []dto.LmsHistorialFila {
	notas := map[uint]map[uint]*float64{}
	for i := range ents {
		if notas[ents[i].AprendizID] == nil {
			notas[ents[i].AprendizID] = map[uint]*float64{}
		}
		notas[ents[i].AprendizID][ents[i].ActividadID] = ents[i].Calificacion
	}
	out := make([]dto.LmsHistorialFila, 0, len(aps)*len(acts))
	for i := range aps {
		nombre := nombreAprendizHistorial(aps[i])
		for j := range acts {
			max := 100.0
			if acts[j].CalificacionMax != nil {
				max = *acts[j].CalificacionMax
			}
			var nota *float64
			if porAct := notas[aps[i].ID]; porAct != nil {
				nota = porAct[acts[j].ID]
			}
			out = append(out, dto.LmsHistorialFila{
				AprendizID:         aps[i].ID,
				AprendizNombre:     nombre,
				ActividadID:        acts[j].ID,
				Titulo:             acts[j].Titulo,
				Calificacion:       nota,
				CalificacionMax:    max,
				Estado:             aps[i].Estado,
				OcultoEnAsistencia: aps[i].OcultoEnAsistencia,
			})
		}
	}
	sort.SliceStable(out, func(a, b int) bool {
		if out[a].AprendizNombre != out[b].AprendizNombre {
			return out[a].AprendizNombre < out[b].AprendizNombre
		}
		return out[a].Titulo < out[b].Titulo
	})
	return out
}

func nombreAprendizHistorial(ap models.Aprendiz) string {
	if ap.Persona != nil {
		return ap.Persona.GetFullName()
	}
	return ""
}
