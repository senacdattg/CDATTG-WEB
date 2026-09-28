/**
 * Anoto el método de salida en observaciones de la visita.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import "github.com/sena/cdattg-web-golang/models"

func anotarMetodoSalida(abierta *models.PersonaIngresoSalida, metodo string) {
	if metodo == "" {
		return
	}
	if metodo == abierta.MetodoRegistro {
		return
	}
	extra := "salida_metodo=" + metodo
	if abierta.Observaciones == "" {
		abierta.Observaciones = extra
		return
	}
	abierta.Observaciones = abierta.Observaciones + "; " + extra
}
