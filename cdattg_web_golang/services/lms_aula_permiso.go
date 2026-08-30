// Este archivo decide si el LMS deja publicar o solo ver el aula.
// Lo hice porque el admin publicaba en cualquier ficha por el rol.
// Ahora solo publica si está asignado como instructor de esa ficha.
// Lo usa lmsAcceso.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/models"

const rolInstructorCasbin = "INSTRUCTOR"
const rolSuperAdminLMS = "SUPER ADMINISTRADOR"

// lmsEsSuperAdmin solo el rol SUPER ADMINISTRADOR, no admin ni coordinador.
func lmsEsSuperAdmin(roles []string) bool {
	return lmsTieneRol(roles, rolSuperAdminLMS)
}

// lmsPuedeVerHistorial el instructor de la ficha o el superadministrador.
func lmsPuedeVerHistorial(puedePublicar, esSuperAdmin bool) bool {
	return puedePublicar || esSuperAdmin
}

// lmsPuedePublicar exige instructor activo asignado a esa ficha.
// Admin o coordinador no publican por el rol: tienen que estar en la ficha.
func lmsPuedePublicar(staff, rolInstructor bool, inst *models.Instructor, asignado bool, ap *models.Aprendiz) bool {
	// Sin credencial de staff o de instructor no publica, aunque tenga ficha.
	if !(staff || rolInstructor) {
		return false
	}
	// La ficha manda: tiene que estar asignado como instructor activo de esa ficha.
	return inst != nil && inst.Status && asignado && !aprendizActivoDeFicha(ap)
}

// lmsPuedeEntrar staff, asignación a la ficha (aunque esté inactivo) o matrícula de aprendiz.
func lmsPuedeEntrar(staff, asignadoAFicha, esAprendizFicha bool) bool {
	return staff || asignadoAFicha || esAprendizFicha
}

// listaTieneRolInstructor mira si INSTRUCTOR está en la lista de roles ya normalizada.
func listaTieneRolInstructor(roles []string) bool {
	return lmsTieneRol(roles, rolInstructorCasbin)
}
