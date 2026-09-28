/**
 * Compruebo los nombres de tabla que el parche de personal debe crear.
 *
 * @author Cristian Deysdayr Jiménez
 */
package database

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestNombresTablaPersonalRol(t *testing.T) {
	t.Parallel()
	op := models.PersonalOperativoApoyo{}
	adm := models.PersonalAdministrativo{}
	con := models.Contratista{}
	logImp := models.PersonalRolImportLog{}
	if op.TableName() != "personal_operativo_apoyo" {
		t.Fatal("operativo")
	}
	if adm.TableName() != "personal_administrativo" {
		t.Fatal("administrativo")
	}
	if con.TableName() != "contratistas" {
		t.Fatal("contratistas")
	}
	if logImp.TableName() != "personal_rol_import_logs" {
		t.Fatal("import logs")
	}
}
