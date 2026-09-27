/**
 * Pongo un solo rol de módulo en la cuenta, sin dejar roles viejos.
 *
 * @author Cristian Deysdayr Jiménez
 */
package seeders

import (
	"errors"
	"strconv"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// asignarRolExclusivo deja solo ese rol en el usuario del correo.
func asignarRolExclusivo(db *gorm.DB, e *casbin.Enforcer, email, role string) error {
	var user models.User
	err := db.Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	if err != nil {
		return err
	}
	sub := strconv.FormatUint(uint64(user.ID), 10)
	if _, err := authz.DeleteRolesForUser(e, sub); err != nil {
		return err
	}
	_, err = authz.AddRoleForUser(e, sub, role)
	return err
}
