/**
 * Aplico el modo entrada/salida del lookup de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

type lookupModoResultado struct {
	accion                  string
	puede                   bool
	alerta                  string
	permiteSinIngreso       bool
	segundosRestantesSalida int
}

func (s *vigilanciaAccesoService) aplicarModoLookup(
	modo string,
	dentro bool,
	persona *models.Persona,
	abierta *models.PersonaIngresoSalida,
	sedeID uint,
) (*lookupModoResultado, error) {
	out := &lookupModoResultado{accion: accionIngreso, puede: true}
	if dentro {
		out.accion = accionSalida
	}
	if modo == modoEntrada {
		out.accion = accionIngreso
		if dentro {
			out.puede = false
			out.alerta = "La persona ya tiene un ingreso abierto en esta sede. Registre la salida antes de un nuevo ingreso."
		}
		return out, nil
	}
	if modo != modoSalida {
		return out, nil
	}
	out.accion = accionSalida
	if dentro {
		out.segundosRestantesSalida = segundosRestantesSalida(abierta, time.Now())
		return out, nil
	}
	// Quien no está adentro puede salir irregular (automático si ya existe).
	out.puede = true
	out.permiteSinIngreso = true
	ultimaIrregular, err := s.accesoRepo.FindUltimaSalidaSinIngresoByPersonaSede(persona.ID, sedeID)
	if err != nil {
		return nil, err
	}
	out.segundosRestantesSalida = segundosRestantesSalidaIrregular(ultimaIrregular, time.Now())
	return out, nil
}
