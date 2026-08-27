package services

import (
	"errors"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

func lmsUserRoles(userID uint) []string {
	e, err := authz.GetEnforcer(database.GetDB())
	if err != nil {
		return nil
	}
	roles, _ := authz.GetRolesForUser(e, strconv.FormatUint(uint64(userID), 10))
	return roles
}

func lmsTieneRol(roles []string, buscado string) bool {
	for _, r := range roles {
		if r == buscado {
			return true
		}
	}
	return false
}

func lmsEsStaff(roles []string) bool {
	return lmsTieneRol(roles, "SUPER ADMINISTRADOR") ||
		lmsTieneRol(roles, "ADMINISTRADOR") ||
		lmsTieneRol(roles, "COORDINADOR")
}

type lmsAcceso struct {
	instRepo     repositories.InstructorRepository
	instFichaRepo repositories.InstructorFichaRepository
	aprendizRepo repositories.AprendizRepository
}

func newLmsAcceso() *lmsAcceso {
	return &lmsAcceso{
		instRepo:      repositories.NewInstructorRepository(),
		instFichaRepo: repositories.NewInstructorFichaRepository(),
		aprendizRepo:  repositories.NewAprendizRepository(),
	}
}

func (a *lmsAcceso) puedePublicar(user *models.User, fichaID uint, roles []string) bool {
	if lmsEsStaff(roles) {
		return true
	}
	return a.esInstructorDeFicha(user, fichaID)
}

func (a *lmsAcceso) puedeEntrar(user *models.User, fichaID uint, roles []string) bool {
	if a.puedePublicar(user, fichaID, roles) {
		return true
	}
	if user.PersonaID == nil {
		return false
	}
	_, err := a.aprendizRepo.FindByPersonaIDAndFichaID(*user.PersonaID, fichaID)
	return err == nil
}

func (a *lmsAcceso) esInstructorDeFicha(user *models.User, fichaID uint) bool {
	if user.PersonaID == nil {
		return false
	}
	inst, err := a.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil {
		return false
	}
	_, err = a.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, inst.ID)
	return err == nil
}

func (a *lmsAcceso) instructorID(user *models.User) *uint {
	if user.PersonaID == nil {
		return nil
	}
	inst, err := a.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil {
		return nil
	}
	return &inst.ID
}

var ErrLmsSinAcceso = errors.New("no tiene acceso a este aula")
var ErrLmsSinPublicar = errors.New("no puede publicar en este aula")

func (a *lmsAcceso) exigirEntrar(user *models.User, fichaID uint, roles []string) error {
	if !a.puedeEntrar(user, fichaID, roles) {
		return ErrLmsSinAcceso
	}
	return nil
}

func (a *lmsAcceso) exigirPublicar(user *models.User, fichaID uint, roles []string) error {
	if !a.puedePublicar(user, fichaID, roles) {
		return ErrLmsSinPublicar
	}
	return nil
}

func (a *lmsAcceso) fichasDeAprendiz(user *models.User) ([]models.FichaCaracterizacion, error) {
	if user.PersonaID == nil {
		return nil, nil
	}
	mats, err := a.aprendizRepo.FindActivosByPersonaID(*user.PersonaID)
	if err != nil {
		return nil, err
	}
	out := make([]models.FichaCaracterizacion, 0, len(mats))
	for i := range mats {
		if mats[i].FichaCaracterizacion != nil {
			out = append(out, *mats[i].FichaCaracterizacion)
		}
	}
	return out, nil
}
