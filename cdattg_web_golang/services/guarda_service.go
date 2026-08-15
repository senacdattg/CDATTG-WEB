// @module guarda_service
// @description Lógica de negocio de Guardas: creación desde Persona con rol Casbin, CRUD y mapeo a DTO.
// @author JDTWOR
// @created 2026-08-14
package services

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const errMsgGuardaNoEncontrado = "guarda no encontrado"

type GuardaService interface {
	CreateFromPersona(req dto.CreateGuardaRequest) (*dto.RolPersonalItem, error)
	GetByID(id uint) (*dto.RolPersonalItem, error)
	Update(id uint, req dto.UpdateGuardaRequest) (*dto.RolPersonalItem, error)
	Delete(id uint) error
}

type guardaService struct {
	repo        repositories.GuardaRepository
	personaRepo repositories.PersonaRepository
	userRepo    repositories.UserRepository
}

func NewGuardaService() GuardaService {
	return &guardaService{
		repo:        repositories.NewGuardaRepository(),
		personaRepo: repositories.NewPersonaRepository(),
		userRepo:    repositories.NewUserRepository(),
	}
}

func (s *guardaService) CreateFromPersona(req dto.CreateGuardaRequest) (*dto.RolPersonalItem, error) {
	persona, err := s.personaRepo.FindByID(req.PersonaID)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}
	exist, _ := s.repo.FindByPersonaID(req.PersonaID)
	if exist != nil {
		return nil, errors.New("esta persona ya es guarda")
	}
	guarda := models.Guarda{
		PersonaID:            req.PersonaID,
		Status:               true,
		NombreCompletoCache:  persona.GetFullName(),
		NumeroDocumentoCache: persona.NumeroDocumento,
	}
	if err := s.repo.Create(&guarda); err != nil {
		return nil, fmt.Errorf("error al crear guarda: %w", err)
	}
	user, _ := s.userRepo.FindByPersonaID(req.PersonaID)
	if user != nil {
		db := database.GetDB()
		e, err := authz.GetEnforcer(db)
		if err == nil {
			_, _ = authz.AddRoleForUser(e, strconv.FormatUint(uint64(user.ID), 10), authz.RolGuarda)
			_ = e.SavePolicy()
		}
	}
	return &dto.RolPersonalItem{ID: guarda.ID, Nombre: guarda.NombreCompletoCache}, nil
}

func (s *guardaService) GetByID(id uint) (*dto.RolPersonalItem, error) {
	guarda, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgGuardaNoEncontrado)
	}
	return guardaToItem(guarda), nil
}

func (s *guardaService) Update(id uint, req dto.UpdateGuardaRequest) (*dto.RolPersonalItem, error) {
	guarda, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgGuardaNoEncontrado)
	}
	if req.Estado != nil {
		guarda.Status = *req.Estado
	}
	if err := s.repo.Update(guarda); err != nil {
		return nil, fmt.Errorf("error al actualizar guarda: %w", err)
	}
	updated, _ := s.repo.FindByID(id)
	return guardaToItem(updated), nil
}

func (s *guardaService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New(errMsgGuardaNoEncontrado)
	}
	return s.repo.Delete(id)
}

// guardaToItem: documento y nombre desde Persona (guarda solo tiene persona_id).
func guardaToItem(m *models.Guarda) *dto.RolPersonalItem {
	var nombre, doc string
	if m.Persona != nil {
		nombre = m.Persona.GetFullName()
		doc = m.Persona.NumeroDocumento
	}
	if nombre == "" {
		nombre = m.NombreCompletoCache
	}
	if doc == "" {
		doc = m.NumeroDocumentoCache
	}
	return &dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}