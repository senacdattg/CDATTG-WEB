/**
 * Creo las tablas de personal operativo, administrativo y contratistas al arrancar.
 * Lo hice porque producción no corre Migrate() completo y esas pantallas daban 500
 * (tabla inexistente). Lo usa EnsureSchemaPatches.
 *
 * @author Cristian Deysdayr Jiménez
 */
package database

import (
	"log"

	"github.com/sena/cdattg-web-golang/models"
)

func patchAutoMigratePersonalRol() error {
	if err := DB.AutoMigrate(
		&models.PersonalOperativoApoyo{},
		&models.PersonalAdministrativo{},
		&models.Contratista{},
		&models.PersonalRolImportLog{},
	); err != nil {
		return err
	}
	log.Println("Esquema: tablas de personal operativo, administrativo y contratistas verificadas")
	return nil
}
