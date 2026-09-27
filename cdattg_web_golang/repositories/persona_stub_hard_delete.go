/**
 * Quito del todo a una persona stub, incluso carpetas LMS y visitas viejas.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"errors"
	"strings"

	"github.com/sena/cdattg-web-golang/models"
)

// Tablas que bloquean el DELETE de personas (carpetas del aula, avisos, etc.).
var sqlHijosAntesDeBorrarPersona = []struct {
	tabla string
	sql   string
}{
	{"lms_carpetas_ficha", `DELETE FROM lms_carpetas_ficha WHERE persona_id = ?`},
	{"lms_carpetas_persona", `DELETE FROM lms_carpetas_persona WHERE persona_id = ?`},
	{"entrada_salida", `DELETE FROM entrada_salida WHERE persona_id = ?`},
	{"persona_contact_alerts", `DELETE FROM persona_contact_alerts WHERE persona_id = ?`},
	{"reporte_salida_automatica", `DELETE FROM reporte_salida_automatica WHERE persona_id = ?`},
	{"persona_cambios_pendientes", `DELETE FROM persona_cambios_pendientes WHERE persona_id = ?`},
	{"persona_ingreso_salida", `DELETE FROM persona_ingreso_salida WHERE persona_id = ?`},
}

func (r *personaRepository) HardDelete(id uint) error {
	if err := r.quitarHijosAntesDeBorrarPersona(id); err != nil {
		return err
	}
	err := r.db.Unscoped().Delete(&models.Persona{}, id).Error
	if err != nil && strings.Contains(err.Error(), "23503") {
		return errors.New("no se pudo borrar: aún hay datos ligados a esa persona")
	}
	return err
}

func (r *personaRepository) quitarHijosAntesDeBorrarPersona(id uint) error {
	for _, h := range sqlHijosAntesDeBorrarPersona {
		if !r.db.Migrator().HasTable(h.tabla) {
			continue
		}
		if err := r.db.Exec(h.sql, id).Error; err != nil {
			return err
		}
	}
	return nil
}
