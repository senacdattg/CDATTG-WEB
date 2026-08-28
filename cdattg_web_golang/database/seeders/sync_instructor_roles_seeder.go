package seeders

import (
	"log"
	"strconv"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// RunSyncInstructorRolesSeeder alinea Casbin con instructors.status (activo = rol INSTRUCTOR).
func RunSyncInstructorRolesSeeder(db *gorm.DB) error {
	log.Println("Ejecutando SyncInstructorRolesSeeder...")
	var list []models.Instructor
	if err := db.Where("deleted_at IS NULL").Find(&list).Error; err != nil {
		return err
	}
	if len(list) == 0 {
		return nil
	}
	e, err := authz.GetEnforcer(db)
	if err != nil {
		return err
	}
	porPersona := make(map[uint]bool, len(list))
	ids := make([]uint, 0, len(list))
	for i := range list {
		porPersona[list[i].PersonaID] = list[i].Status
		ids = append(ids, list[i].PersonaID)
	}
	var users []models.User
	if err := db.Where("persona_id IN ?", ids).Find(&users).Error; err != nil {
		return err
	}
	for _, user := range users {
		if user.PersonaID == nil {
			continue
		}
		sub := strconv.FormatUint(uint64(user.ID), 10)
		if skipExclusiveModuleUser(e, sub) {
			continue
		}
		if porPersona[*user.PersonaID] {
			_, _ = authz.AddRoleForUser(e, sub, "INSTRUCTOR")
			continue
		}
		_, _ = e.DeleteRoleForUser(sub, "INSTRUCTOR")
	}
	_ = e.SavePolicy()
	log.Println("SyncInstructorRolesSeeder completado.")
	return nil
}
