// Este archivo es la fila del historial de notas del aula.
// Lo hice para devolver nombre, título y cuánto sacó en un solo JSON.
// Lo usa GET /lms/aulas/:fichaId/calificaciones.
//
// @author Cristian Deysdayr Jiménez
package dto

// LmsHistorialFila una nota de un aprendiz en una actividad del aula.
type LmsHistorialFila struct {
	AprendizID      uint     `json:"aprendiz_id"`
	AprendizNombre  string   `json:"aprendiz_nombre"`
	ActividadID     uint     `json:"actividad_id"`
	Titulo          string   `json:"titulo"`
	Calificacion        *float64 `json:"calificacion"`
	CalificacionMax     float64  `json:"calificacion_max"`
	Estado              bool     `json:"estado"`
	OcultoEnAsistencia  bool     `json:"oculto_en_asistencia"`
}
