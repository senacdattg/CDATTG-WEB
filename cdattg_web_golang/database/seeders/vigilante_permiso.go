/**
 * Al arrancar dejo al vigilante y al super vigilante con el módulo completo.
 * En producción no se corre el seeder grande; por eso el menú salía incompleto.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"log"

	"github.com/sena/cdattg-web-golang/authz"
	"gorm.io/gorm"
)

// SyncVigilanciaModulo pone permisos del módulo y el rol en ambas cuentas.
func SyncVigilanciaModulo(db *gorm.DB) error {
	log.Println("Sincronizando cuentas y permisos de vigilancia...")
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	if err := seedVigilanciaPermissions(e); err != nil {
		return err
	}
	if err := EnsureUsuarioVigilante(db); err != nil {
		return err
	}
	if err := EnsureUsuarioSupervigilante(db); err != nil {
		return err
	}
	if err := asignarRolExclusivo(db, e, correoVigilanteSeed, "VIGILANTE"); err != nil {
		return err
	}
	if err := asignarRolExclusivo(db, e, correoSupervigilanteSeed, authz.RolSupervigilante); err != nil {
		return err
	}
	return e.SavePolicy()
}

// SyncSupervigilantePermission queda como alias del arranque de vigilancia.
func SyncSupervigilantePermission(db *gorm.DB) error {
	return SyncVigilanciaModulo(db)
}
