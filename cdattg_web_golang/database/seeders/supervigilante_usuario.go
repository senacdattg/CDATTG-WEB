/**
 * Creo la cuenta de super vigilante si no está.
 * Lo pongo al arrancar para que en producción exista el correo.
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
	correoSupervigilanteSeed = "supervigilantesena@dataguaviare.com.co"
	docSupervigilanteSeed    = "9000000015"
)

func ensurePersonaSupervigilante(db *gorm.DB) (models.Persona, error) {
	var p models.Persona
	err := db.Where("email = ? OR numero_documento = ?", correoSupervigilanteSeed, docSupervigilanteSeed).First(&p).Error
	if err == nil {
		return p, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Persona{}, err
	}
	p = models.Persona{
		NumeroDocumento: docSupervigilanteSeed,
		PrimerNombre:    "SUPER",
		SegundoNombre:   "VIGILANCIA",
		PrimerApellido:  "SENA",
		SegundoApellido: "CDATTG",
		Celular:         "3081111115",
		Email:           correoSupervigilanteSeed,
		Direccion:       "CALLE 11 #11-15",
		Status:          true,
	}
	if err := db.Create(&p).Error; err != nil {
		return models.Persona{}, err
	}
	return p, nil
}

func ensureUserSupervigilante(db *gorm.DB, personaID uint) (models.User, error) {
	var u models.User
	err := db.Where("email = ?", correoSupervigilanteSeed).First(&u).Error
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
	u = models.User{
		Email:     correoSupervigilanteSeed,
		Password:  hash,
		Status:    true,
		PersonaID: &personaID,
	}
	if err := db.Create(&u).Error; err != nil {
		return models.User{}, err
	}
	return u, nil
}

// EnsureUsuarioSupervigilante deja persona + usuario (sin pisar clave si ya hay cuenta).
func EnsureUsuarioSupervigilante(db *gorm.DB) error {
	p, err := ensurePersonaSupervigilante(db)
	if err != nil {
		return err
	}
	if _, err := ensureUserSupervigilante(db, p.ID); err != nil {
		return err
	}
	log.Println("Usuario super vigilante verificado:", correoSupervigilanteSeed)
	return nil
}
