/**
 * Dejo el rol bibliotecario con permiso de solo ver carnets regulares.
 * Lo corro al arrancar para bases que ya existían.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"log"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
	"gorm.io/gorm"
)

const correoBibliotecaSeed = "biblioteca@dataguaviare.com.co"

// seedBibliotecarioPermissions da ver carnets regulares (con fotos, Excel y ZIP), revisar
// reposiciones de carnet y mirar aprendices en modo lectura. Sin gestión de fichas ni instructores.
func seedBibliotecarioPermissions(e *casbin.Enforcer) error {
	if _, err := authz.AddPermissionForRole(e, authz.RolBibliotecario, authz.ObjCarnet, authz.ActVerCarnetBiblioteca); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, authz.RolBibliotecario, authz.ObjCarnet, authz.ActMarcarCarnetBiblioteca); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, authz.RolBibliotecario, authz.ObjCarnet, authz.ActValidarCarnetPerdida); err != nil {
		return err
	}
	// VER APRENDICES/APRENDIZ solo lectura: el bibliotecario mira el aprendiz al buscar su carnet.
	if _, err := authz.AddPermissionForRole(e, authz.RolBibliotecario, authz.ObjAprendiz, "VER APRENDICES"); err != nil {
		return err
	}
	if _, err := authz.AddPermissionForRole(e, authz.RolBibliotecario, authz.ObjAprendiz, "VER APRENDIZ"); err != nil {
		return err
	}
	// Limpieza: bases con versiones previas pudieron dejar (ficha, VER FICHAS) en el rol;
	// ese permiso abría el módulo de Fichas e Instructores.
	if removed, err := e.RemovePolicy(authz.RolBibliotecario, authz.ObjFicha, "VER FICHAS"); err != nil {
		return err
	} else if removed {
		log.Println("Eliminado permiso (ficha, VER FICHAS) del rol BIBLIOTECARIO")
	}
	return seedVerPersonaForRoles(e, []string{authz.RolBibliotecario})
}

// asignarRolBibliotecario pone el rol en el usuario de biblioteca.
func asignarRolBibliotecario(db *gorm.DB, e *casbin.Enforcer) error {
	return asignarRolExclusivo(db, e, correoBibliotecaSeed, authz.RolBibliotecario)
}
