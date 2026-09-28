/**
 * Compruebo que la cuenta de super vigilante se crea una sola vez.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func dbSupervigilanteTest(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&models.Persona{}, &models.User{}); err != nil {
		t.Fatal(err)
	}
	return db
}

func TestEnsureUsuarioSupervigilanteCreaYNoDuplica(t *testing.T) {
	db := dbSupervigilanteTest(t)
	if err := EnsureUsuarioSupervigilante(db); err != nil {
		t.Fatal(err)
	}
	if err := EnsureUsuarioSupervigilante(db); err != nil {
		t.Fatal(err)
	}
	var n int64
	db.Model(&models.User{}).Where("email = ?", correoSupervigilanteSeed).Count(&n)
	if n != 1 {
		t.Fatalf("usuarios=%d", n)
	}
}

func TestEnsureUsuarioSupervigilanteNoPisaClave(t *testing.T) {
	db := dbSupervigilanteTest(t)
	hash, err := utils.HashPassword("otra-clave-distinta")
	if err != nil {
		t.Fatal(err)
	}
	p := models.Persona{NumeroDocumento: "1", PrimerNombre: "X", PrimerApellido: "Y", Email: correoSupervigilanteSeed, Status: true}
	if err := db.Create(&p).Error; err != nil {
		t.Fatal(err)
	}
	u := models.User{Email: correoSupervigilanteSeed, Password: hash, Status: true, PersonaID: &p.ID}
	if err := db.Create(&u).Error; err != nil {
		t.Fatal(err)
	}
	if err := EnsureUsuarioSupervigilante(db); err != nil {
		t.Fatal(err)
	}
	var got models.User
	db.Where("email = ?", correoSupervigilanteSeed).First(&got)
	if got.Password != hash {
		t.Fatal("no debe cambiar la clave si la cuenta ya existía")
	}
}

func TestVigilanteNoLlevaAltaPersonalEnPaqueteBase(t *testing.T) {
	for _, p := range authz.PermisosVigilancia {
		if p == "CREAR PERSONA" {
			t.Fatal("el vigilante no debe crear personas por el paquete base")
		}
	}
}

func TestVigilanteNoTienePermisoBorrarEnListaBase(t *testing.T) {
	for _, p := range authz.PermisosVigilancia {
		if p == authz.ActBorrarAccesoSede {
			t.Fatal("el vigilante no debe llevar borrar en la lista base")
		}
	}
	if !authz.IsValidPermiso(authz.ObjVigilancia, authz.ActBorrarAccesoSede) {
		t.Fatal("borrar debe existir para super vigilante y superadmin")
	}
}
