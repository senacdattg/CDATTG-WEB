/**
 * Cargo la persona del lookup sin crear usuario hasta confirmar el ingreso.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type lookupPersonaCarga struct {
	persona *models.Persona
	tipos   []string
	fichas  []dto.AccesoFichaResumen
	abierta *models.PersonaIngresoSalida
	esNueva bool
}

func (s *vigilanciaAccesoService) cargarPersonaLookup(doc string, sedeID uint) (*lookupPersonaCarga, error) {
	persona, err := s.personaRepo.FindByNumeroDocumento(doc)
	if err == nil && persona != nil {
		return s.cargarPersonaExistenteLookup(persona, sedeID)
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &lookupPersonaCarga{
			persona: &models.Persona{NumeroDocumento: doc, Status: true},
			tipos:   []string{tipoVisitante},
			esNueva: true,
		}, nil
	}
	return nil, err
}

func (s *vigilanciaAccesoService) cargarPersonaExistenteLookup(
	persona *models.Persona,
	sedeID uint,
) (*lookupPersonaCarga, error) {
	tipos, fichas := s.resolverVistaAcceso(persona.ID)
	abierta, err := s.accesoRepo.FindAbiertaByPersonaAndSede(persona.ID, sedeID)
	if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		err = nil
	}
	if err != nil {
		return nil, err
	}
	return &lookupPersonaCarga{
		persona: persona,
		tipos:   tipos,
		fichas:  fichas,
		abierta: abierta,
	}, nil
}
