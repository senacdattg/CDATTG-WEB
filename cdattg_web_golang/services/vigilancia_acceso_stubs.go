/**
 * Listo y borro del sistema personas sin nombre creadas por error en portería.
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

func (s *vigilanciaAccesoService) ListPersonasSinNombre(page, pageSize int) (*dto.AccesoStubsListaResponse, error) {
	rows, total, err := s.personaRepo.ListStubsPorteria(page, pageSize)
	if err != nil {
		return nil, err
	}
	items := make([]dto.AccesoStubItem, 0, len(rows))
	for _, p := range rows {
		items = append(items, dto.AccesoStubItem{ID: p.ID, NumeroDocumento: p.NumeroDocumento})
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 50
	}
	return &dto.AccesoStubsListaResponse{Items: items, Total: total, Page: page, PageSize: pageSize}, nil
}

func (s *vigilanciaAccesoService) personaSePuedeBorrarStub(p *models.Persona) error {
	if PersonaEsStubPorteria(p) {
		// sigue: stub de portería
	} else {
		return errors.New("esa persona tiene nombre u otros datos; no se borra")
	}
	if ap, err := s.aprendizRepo.FindByPersonaID(p.ID); err == nil && ap != nil {
		return errors.New("esa persona está en una ficha; no se borra")
	} else if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		err = nil
	} else if err != nil {
		return err
	}
	if ins, err := s.instructorRepo.FindByPersonaID(p.ID); err == nil && ins != nil {
		return errors.New("esa persona es instructor; no se borra")
	} else if err != nil && errors.Is(err, gorm.ErrRecordNotFound) {
		err = nil
	} else if err != nil {
		return err
	}
	return nil
}

func (s *vigilanciaAccesoService) borrarUnStub(id uint) error {
	p, err := s.personaRepo.FindByID(id)
	if err != nil {
		return err
	}
	if err := s.personaSePuedeBorrarStub(p); err != nil {
		return err
	}
	if err := s.accesoRepo.DeleteHardByPersonaID(id); err != nil {
		return err
	}
	if err := s.userAccounts.BorrarForPersona(id); err != nil {
		return err
	}
	return s.personaRepo.HardDelete(id)
}
