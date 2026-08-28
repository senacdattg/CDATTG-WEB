// Este archivo borra una publicación y lo que cuelga de ella (envíos y archivos).
// Lo hice porque GORM no cascada solo al marcar deleted_at en la actividad.
// Lo usa DeleteActividad.
//
// @author Cristian Deysdayr Jiménez
package repositories

import (
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const whereLmsActividadID = "actividad_id = ?"

// DeleteConRelaciones marca borradas la actividad, adjuntos y entregas.
func (r *lmsActividadRepository) DeleteConRelaciones(actividadID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		sub := tx.Model(&models.LmsEntrega{}).Select("id").Where(whereLmsActividadID, actividadID)
		if err := tx.Where("entrega_id IN (?)", sub).Delete(&models.LmsEntregaArchivo{}).Error; err != nil {
			return err
		}
		if err := tx.Where(whereLmsActividadID, actividadID).Delete(&models.LmsEntrega{}).Error; err != nil {
			return err
		}
		if err := tx.Where(whereLmsActividadID, actividadID).Delete(&models.LmsActividadArchivo{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.LmsActividad{}, actividadID).Error
	})
}
