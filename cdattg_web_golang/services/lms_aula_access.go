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
	ap, inst, asignado := a.contextoFicha(user, fichaID)
	return lmsPuedePublicar(lmsEsStaff(roles), listaTieneRolInstructor(roles), inst, asignado, ap)
}

func (a *lmsAcceso) puedeEntrar(user *models.User, fichaID uint, roles []string) bool {
	if lmsEsStaff(roles) {
		return true
	}
	ap, _, asignado := a.contextoFicha(user, fichaID)
	return lmsPuedeEntrar(false, asignado, ap != nil)
}

func (a *lmsAcceso) contextoFicha(user *models.User, fichaID uint) (*models.Aprendiz, *models.Instructor, bool) {
	if user.PersonaID == nil {
		return nil, nil, false
	}
	ap, _ := a.aprendizRepo.FindByPersonaIDAndFichaID(*user.PersonaID, fichaID)
	inst, err := a.instRepo.FindByPersonaID(*user.PersonaID)
	if err != nil {
		return ap, nil, false
	}
	_, err = a.instFichaRepo.FindByFichaIDAndInstructorID(fichaID, inst.ID)
	return ap, inst, err == nil
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
var ErrLmsSinHistorial = errors.New("no puede ver el historial de este aula")

func (a *lmsAcceso) puedeVerHistorial(user *models.User, fichaID uint, roles []string) bool {
	return a.puedePublicar(user, fichaID, roles)
}

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

func (a *lmsAcceso) exigirVerHistorial(user *models.User, fichaID uint, roles []string) error {
	if !a.puedeVerHistorial(user, fichaID, roles) {
		return ErrLmsSinHistorial
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
