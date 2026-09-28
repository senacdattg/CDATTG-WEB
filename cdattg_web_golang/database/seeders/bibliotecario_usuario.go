/**
 * Creo en producción la cuenta de biblioteca si no está.
 * En local el seeder grande sí la deja; al desplegar no se corre y el login
 * decía que el usuario no existía.
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

const docBibliotecaSeed = "9000000012"

func ensurePersonaBiblioteca(db *gorm.DB) (models.Persona, error) {
	var p models.Persona
	err := db.Where("email = ? OR numero_documento = ?", correoBibliotecaSeed, docBibliotecaSeed).First(&p).Error
	if err == nil {
		return p, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Persona{}, err
	}
	p = models.Persona{
		NumeroDocumento: docBibliotecaSeed,
		PrimerNombre:    "BIBLIOTECA",
		SegundoNombre:   "SENA",
		PrimerApellido:  "CDATTG",
		SegundoApellido: "PRUEBAS",
		Celular:         "3091212120",
		Email:           correoBibliotecaSeed,
		Direccion:       "CALLE 12 #12-12",
		Status:          true,
	}
	if err := db.Create(&p).Error; err != nil {
		return models.Persona{}, err
	}
	return p, nil
}

func ensureUserBiblioteca(db *gorm.DB, personaID uint) (models.User, error) {
	var u models.User
	err := db.Where("email = ?", correoBibliotecaSeed).First(&u).Error
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
		Email:     correoBibliotecaSeed,
		Password:  hash,
		Status:    true,
		PersonaID: &personaID,
	}
	if err := db.Create(&u).Error; err != nil {
		return models.User{}, err
	}
	return u, nil
}

// EnsureUsuarioBiblioteca deja persona + usuario de biblioteca (sin pisar clave si ya hay cuenta).
func EnsureUsuarioBiblioteca(db *gorm.DB) error {
	p, err := ensurePersonaBiblioteca(db)
	if err != nil {
		return err
	}
	if _, err := ensureUserBiblioteca(db, p.ID); err != nil {
		return err
	}
	log.Println("Usuario de biblioteca verificado:", correoBibliotecaSeed)
	return nil
}
