/**
 * Doy al super vigilante alta de personas y de roles de personal.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
)

/**
 * Pongo ver y crear de personal y crear/listar personas solo en SUPER VIGILANTE.
 */
func seedSupervigilanteAltaPersonal(e *casbin.Enforcer) error {
	role := authz.RolSupervigilante
	if err := addPermissionsForObject(e, role, authz.ObjPersona, authz.PermisosAltaPersonaSupervigilante); err != nil {
		return err
	}
	if err := addPermissionsForObject(e, role, authz.ObjPersonalOperativoYDeApoyo, authz.VerYCrearDe(authz.PermisosPersonalOperativoYDeApoyo)); err != nil {
		return err
	}
	if err := addPermissionsForObject(e, role, authz.ObjPersonalAdministrativo, authz.VerYCrearDe(authz.PermisosPersonalAdministrativo)); err != nil {
		return err
	}
	return addPermissionsForObject(e, role, authz.ObjContratista, authz.VerYCrearDe(authz.PermisosContratista))
}
