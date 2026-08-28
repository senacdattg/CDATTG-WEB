// Este archivo decide si el aprendiz puede entregar o solo consultar.
// Lo hice porque ocultar de asistencia no debe echarlo del aula, pero sí
// quitarle el envío de archivos. Lo usan Entregar, Deshacer y GetActividad.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/models"
)

// ErrLmsSoloConsulta el aprendiz oculto en asistencia entra al aula pero no entrega.
var ErrLmsSoloConsulta = errors.New("solo puede consultar el aula; no puede subir archivos")

// lmsAprendizPuedeEntregar false si está inactivo u oculto en asistencia.
func lmsAprendizPuedeEntregar(ap *models.Aprendiz) bool {
	return ap != nil && ap.Estado && !ap.OcultoEnAsistencia
}

// exigirEntregaAprendiz bloquea subir o deshacer cuando la ficha quedó en consulta.
func exigirEntregaAprendiz(ap *models.Aprendiz) error {
	if !lmsAprendizPuedeEntregar(ap) {
		return ErrLmsSoloConsulta
	}
	return nil
}
