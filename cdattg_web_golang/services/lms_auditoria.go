// Este archivo arma el servicio de auditoría LMS.
// Lo hice para mirar carpetas y entregas sin mezclarlo con el aula.
// Lo usan los handlers de auditoría.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const lmsAuditoriaPageSize = 20

// LmsAuditoriaService busca personas y abre sus carpetas LMS.
type LmsAuditoriaService interface {
	Buscar(userID uint, q string, page int) (*dto.LmsAuditoriaBusqueda, error)
	Persona(userID, personaID uint) (*dto.LmsAuditoriaPersonaDetalle, error)
	Tipo(userID, personaID uint, tipo string) (*dto.LmsAuditoriaTipoDetalle, error)
	ListarFicha(userID, fichaID uint) ([]dto.LmsAuditoriaPersonaItem, error)
}

type lmsAuditoriaService struct {
	users       repositories.UserRepository
	carpetas    repositories.LmsCarpetaRepository
	entregas    repositories.LmsEntregaRepository
	aprendices  repositories.AprendizRepository
	actividades repositories.LmsActividadRepository
	instFichas  repositories.InstructorFichaRepository
	fichas      repositories.FichaRepository
	personas    repositories.PersonaRepository
	acceso      *lmsAcceso
}

// NewLmsAuditoriaService constructor.
func NewLmsAuditoriaService() LmsAuditoriaService {
	return &lmsAuditoriaService{
		users:       repositories.NewUserRepository(),
		carpetas:    repositories.NewLmsCarpetaRepository(),
		entregas:    repositories.NewLmsEntregaRepository(),
		aprendices:  repositories.NewAprendizRepository(),
		actividades: repositories.NewLmsActividadRepository(),
		instFichas:  repositories.NewInstructorFichaRepository(),
		fichas:      repositories.NewFichaRepository(),
		personas:    repositories.NewPersonaRepository(),
		acceso:      newLmsAcceso(),
	}
}

func (s *lmsAuditoriaService) usuarioYRoles(userID uint) (*models.User, []string, error) {
	user, err := s.users.FindByID(userID)
	if err != nil {
		return nil, nil, errors.New("usuario no encontrado")
	}
	return user, lmsUserRoles(userID), nil
}
