/**
 * Cierro la visita o registro una salida irregular, con la espera mínima.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strconv"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type salidaCierreIn struct {
	persona            *models.Persona
	abierta            *models.PersonaIngresoSalida
	errVisita          error
	sedeID             uint
	userID             uint
	motivo             string
	observacion        string
	metodo             string
	tipoPersona        string
	permitirSinIngreso bool
}

// Armo el aviso de espera entre un movimiento y el siguiente.
func errFaltanSegundosSalida(restante int, contexto string) error {
	return errors.New("faltan " + strconv.Itoa(restante) + " segundos desde " + contexto)
}

// Cierro la visita abierta o, si no hay, una salida irregular.
func (s *vigilanciaAccesoService) completarSalida(in salidaCierreIn) (*dto.AccesoRegistroResponse, error) {
	if in.errVisita == nil && in.abierta != nil {
		if restante := segundosRestantesSalida(in.abierta, time.Now()); restante > 0 {
			return nil, errFaltanSegundosSalida(restante, "el ingreso para registrar la salida")
		}
		return s.cerrarVisita(in.abierta, in.persona, in.motivo, in.observacion, in.metodo, in.userID, in.sedeID)
	}
	if in.errVisita != nil && !errors.Is(in.errVisita, gorm.ErrRecordNotFound) {
		return nil, in.errVisita
	}
	if in.permitirSinIngreso {
		return s.completarSalidaIrregular(in)
	}
	return nil, errors.New("no hay un ingreso abierto para esta persona")
}

// Registro salida sin ingreso, respetando la espera desde la anterior.
func (s *vigilanciaAccesoService) completarSalidaIrregular(in salidaCierreIn) (*dto.AccesoRegistroResponse, error) {
	ultimaIrregular, err := s.accesoRepo.FindUltimaSalidaSinIngresoByPersonaSede(in.persona.ID, in.sedeID)
	if err != nil {
		return nil, err
	}
	if restante := segundosRestantesSalidaIrregular(ultimaIrregular, time.Now()); restante > 0 {
		return nil, errFaltanSegundosSalida(restante, "la salida irregular anterior para volver a registrarla")
	}
	return s.crearSalidaSinIngreso(in.persona, in.sedeID, in.motivo, in.observacion, in.metodo, in.tipoPersona, in.userID)
}
