/**
 * Quito usuario y roles Casbin de una persona stub de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/database"
	"gorm.io/gorm"
)

func (s *personaUserAccountService) BorrarForPersona(personaID uint) error {
	user, err := s.userRepo.FindByPersonaID(personaID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = nil
	}
	if err != nil {
		return err
	}
	if user != nil {
		if e, eErr := authz.GetEnforcer(database.GetDB()); eErr == nil {
			_, _ = authz.DeleteRolesForUser(e, strconv.FormatUint(uint64(user.ID), 10))
		}
	}
	return s.userRepo.HardDeleteByPersonaID(personaID)
}
