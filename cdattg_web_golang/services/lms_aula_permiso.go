// Este archivo guarda el nombre del rol de instructor para el LMS.
// Lo hice para no repetir el literal INSTRUCTOR en alta, baja y permisos.
// Lo usan instructor_rol_sync y permisos_service.
//
// @author Cristian Deysdayr Jiménez
package services

const rolInstructorCasbin = "INSTRUCTOR"

// listaTieneRolInstructor mira si INSTRUCTOR está en la lista de roles ya normalizada.
func listaTieneRolInstructor(roles []string) bool {
	return lmsTieneRol(roles, rolInstructorCasbin)
}
