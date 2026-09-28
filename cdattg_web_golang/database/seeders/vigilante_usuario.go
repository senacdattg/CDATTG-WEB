/**
 * Creo la cuenta de portería si no está.
 * En producción no se corre el seeder grande y el vigilante queda sin rol o sin menú.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"errors"
	"log"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/utils"
	"gorm.io/gorm"
)

const (
	correoVigilanteSeed = "vigilanciasena@dataguaviare.com.co"
	docVigilanteSeed    = "9000000011"
)

func ensurePersonaVigilante(db *gorm.DB) (models.Persona, error) {
	var p models.Persona
	err := db.Where("email = ? OR numero_documento = ?", correoVigilanteSeed, docVigilanteSeed).First(&p).Error
	if err == nil {
		return p, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Persona{}, err
	}
	p = models.Persona{
		NumeroDocumento: docVigilanteSeed,
		PrimerNombre:    "VIGILANCIA",
		SegundoNombre:   "SENA",
		PrimerApellido:  "CDATTG",
		SegundoApellido: "PRUEBAS",
		Celular:         "3081111110",
		Email:           correoVigilanteSeed,
		Direccion:       "CALLE 11 #11-11",
		Status:          true,
	}
	if err := db.Create(&p).Error; err != nil {
		return models.Persona{}, err
	}
	return p, nil
}

func ensureUserVigilante(db *gorm.DB, personaID uint) (models.User, error) {
	var u models.User
	err := db.Where("email = ?", correoVigilanteSeed).First(&u).Error
	if err == nil {
		u.Status = true
		u.PersonaID = &personaID
		if err := db.Save(&u).Error; err != nil {
			return models.User{}, err
		}
		return u, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.User{}, err
	}
	hash, err := utils.HashPassword(seedPasswordDefault)
	if err != nil {
		return models.User{}, err
	}
	u = models.User{Email: correoVigilanteSeed, Password: hash, Status: true, PersonaID: &personaID}
	if err := db.Create(&u).Error; err != nil {
		return models.User{}, err
	}
	return u, nil
}

// EnsureUsuarioVigilante deja persona + usuario (sin pisar clave si ya hay cuenta).
func EnsureUsuarioVigilante(db *gorm.DB) error {
	p, err := ensurePersonaVigilante(db)
	if err != nil {
		return err
	}
	if _, err := ensureUserVigilante(db, p.ID); err != nil {
		return err
	}
	log.Println("Usuario de vigilancia verificado:", correoVigilanteSeed)
	return nil
}
