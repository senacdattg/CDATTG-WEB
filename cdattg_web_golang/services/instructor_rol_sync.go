// Este archivo sincroniza el rol INSTRUCTOR de Casbin con el estado
// del registro en instructors. Lo hice porque en Permisos se quitaba
// el rol y el LMS seguía viéndolo como instructor activo.
// Lo usan SetRoles, alta/edición/baja de instructor.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// sincronizarEstadoInstructorConRol apaga o enciende instructors.status según el rol.
func sincronizarEstadoInstructorConRol(personaID *uint, activo bool) {
	if personaID == nil {
		return
	}
	repo := repositories.NewInstructorRepository()
	inst, err := repo.FindByPersonaID(*personaID)
	if err != nil || inst == nil || inst.Status == activo {
		return
	}
	inst.Status = activo
	_ = repo.Update(inst)
}

// sincronizarRolInstructorCasbin pone o quita el rol INSTRUCTOR del usuario.
func sincronizarRolInstructorCasbin(user *models.User, activo bool) {
	if user == nil {
		return
	}
	e, err := authz.GetEnforcer(database.GetDB())
	if err != nil {
		return
	}
	sub := strconv.FormatUint(uint64(user.ID), 10)
	if activo {
		_, _ = authz.AddRoleForUser(e, sub, rolInstructorCasbin)
	} else {
		_, _ = e.DeleteRoleForUser(sub, rolInstructorCasbin)
	}
	_ = e.SavePolicy()
}
