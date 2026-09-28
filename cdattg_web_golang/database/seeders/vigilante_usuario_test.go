/**
 * Compruebo que la cuenta de portería se crea una sola vez.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func dbVigilanteTest(t *testing.T) *gorm.DB {
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

func TestEnsureUsuarioVigilanteCreaYNoDuplica(t *testing.T) {
	db := dbVigilanteTest(t)
	if err := EnsureUsuarioVigilante(db); err != nil {
		t.Fatal(err)
	}
	if err := EnsureUsuarioVigilante(db); err != nil {
		t.Fatal(err)
	}
	var n int64
	db.Model(&models.User{}).Where("email = ?", correoVigilanteSeed).Count(&n)
	if n != 1 {
		t.Fatalf("usuarios=%d", n)
	}
}

func TestEnsureUsuarioVigilanteNoPisaClave(t *testing.T) {
	db := dbVigilanteTest(t)
	hash, err := utils.HashPassword("otra-clave-distinta")
	if err != nil {
		t.Fatal(err)
	}
	p := models.Persona{NumeroDocumento: "1", PrimerNombre: "X", PrimerApellido: "Y", Email: correoVigilanteSeed, Status: true}
	if err := db.Create(&p).Error; err != nil {
		t.Fatal(err)
	}
	u := models.User{Email: correoVigilanteSeed, Password: hash, Status: true, PersonaID: &p.ID}
	if err := db.Create(&u).Error; err != nil {
		t.Fatal(err)
	}
	if err := EnsureUsuarioVigilante(db); err != nil {
		t.Fatal(err)
	}
	var got models.User
	db.Where("email = ?", correoVigilanteSeed).First(&got)
	if got.Password != hash {
		t.Fatal("no debe cambiar la clave si la cuenta ya existía")
	}
}
