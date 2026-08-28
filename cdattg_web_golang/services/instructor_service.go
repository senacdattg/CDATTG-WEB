package services

import (
	"errors"
	"fmt"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const errMsgInstructorNoEncontrado = "instructor no encontrado"

type InstructorService interface {
	CreateFromPersona(req dto.CreateInstructorRequest) (*dto.InstructorItem, error)
	GetByID(id uint) (*dto.InstructorItem, error)
	Update(id uint, req dto.UpdateInstructorRequest) (*dto.InstructorItem, error)
	Delete(id uint) error
}

type instructorService struct {
	repo     repositories.InstructorRepository
	personaRepo repositories.PersonaRepository
	userRepo repositories.UserRepository
}

func NewInstructorService() InstructorService {
	return &instructorService{
		repo:       repositories.NewInstructorRepository(),
		personaRepo: repositories.NewPersonaRepository(),
		userRepo:   repositories.NewUserRepository(),
	}
}

func (s *instructorService) CreateFromPersona(req dto.CreateInstructorRequest) (*dto.InstructorItem, error) {
	persona, err := s.personaRepo.FindByID(req.PersonaID)
	if err != nil {
		return nil, errors.New("persona no encontrada")
	}
	exist, _ := s.repo.FindByPersonaID(req.PersonaID)
	if exist != nil {
		return nil, errors.New("esta persona ya es instructor")
	}
	nombre := persona.GetFullName()
	numeroDoc := persona.NumeroDocumento
	inst := models.Instructor{
		PersonaID:            req.PersonaID,
		RegionalID:           req.RegionalID,
		Status:               true,
		NombreCompletoCache:  nombre,
		NumeroDocumentoCache: numeroDoc,
	}
	// PostgreSQL no acepta '' en columnas JSON; usar "{}" para campos vacíos
	jsonEmpty := "{}"
	inst.Especialidades = jsonEmpty
	inst.Competencias = jsonEmpty
	inst.Jornadas = jsonEmpty
	inst.TitulosObtenidos = jsonEmpty
	inst.InstitucionesEducativas = jsonEmpty
	inst.CertificacionesTecnicas = jsonEmpty
	inst.CursosComplementarios = jsonEmpty
	inst.AreasExperticia = jsonEmpty
	inst.CompetenciasTic = jsonEmpty
	inst.Idiomas = jsonEmpty
	inst.HabilidadesPedagogicas = jsonEmpty
	inst.DocumentosAdjuntos = jsonEmpty
	if err := s.repo.Create(&inst); err != nil {
		return nil, fmt.Errorf("error al crear instructor: %w", err)
	}
	user, _ := s.userRepo.FindByPersonaID(req.PersonaID)
	sincronizarRolInstructorCasbin(user, true)
	return &dto.InstructorItem{ID: inst.ID, Nombre: nombre}, nil
}

func (s *instructorService) GetByID(id uint) (*dto.InstructorItem, error) {
	inst, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("instructor no encontrado")
	}
	return instructorToDTO(inst), nil
}

func (s *instructorService) Update(id uint, req dto.UpdateInstructorRequest) (*dto.InstructorItem, error) {
	inst, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New(errMsgInstructorNoEncontrado)
	}
	if req.RegionalID != nil {
		inst.RegionalID = req.RegionalID
	}
	if req.Estado != nil {
		inst.Status = *req.Estado
	}
	if err := s.repo.Update(inst); err != nil {
		return nil, fmt.Errorf("error al actualizar instructor: %w", err)
	}
	if req.Estado != nil {
		user, _ := s.userRepo.FindByPersonaID(inst.PersonaID)
		sincronizarRolInstructorCasbin(user, *req.Estado)
	}
	updated, _ := s.repo.FindByID(id)
	return instructorToDTO(updated), nil
}

func (s *instructorService) Delete(id uint) error {
	inst, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New(errMsgInstructorNoEncontrado)
	}
	user, _ := s.userRepo.FindByPersonaID(inst.PersonaID)
	if err := s.repo.Delete(id); err != nil {
		return err
	}
	sincronizarRolInstructorCasbin(user, false)
	return nil
}

// instructorToDTO: documento y nombre desde Persona (instructor solo tiene persona_id)
func instructorToDTO(m *models.Instructor) *dto.InstructorItem {
	var nombre, doc, regionalNombre string
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
	if m.Regional != nil {
		regionalNombre = m.Regional.Nombre
	}
	return &dto.InstructorItem{
		ID:              m.ID,
		Nombre:          nombre,
		NumeroDocumento: doc,
		RegionalID:      m.RegionalID,
		RegionalNombre:  regionalNombre,
		Estado:          m.Status,
	}
}
