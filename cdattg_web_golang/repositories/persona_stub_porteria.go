/**
 * Personas creadas por error en portería: solo cédula, sin nombre.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

func (r *personaRepository) qStubPorteria() *gorm.DB {
	return r.db.Model(&models.Persona{}).Where(`
		TRIM(COALESCE(numero_documento, '')) <> ''
		AND TRIM(COALESCE(primer_nombre, '')) = ''
		AND TRIM(COALESCE(segundo_nombre, '')) = ''
		AND TRIM(COALESCE(primer_apellido, '')) = ''
		AND TRIM(COALESCE(segundo_apellido, '')) = ''
		AND TRIM(COALESCE(email, '')) = ''
		AND TRIM(COALESCE(celular, '')) = ''
		AND TRIM(COALESCE(telefono, '')) = ''
		AND (tipo_documento IS NULL OR tipo_documento = 0)
	`)
}

func (r *personaRepository) ListStubsPorteria(page, pageSize int) ([]models.Persona, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 50
	}
	var total int64
	if err := r.qStubPorteria().Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []models.Persona
	err := r.qStubPorteria().
		Order("LENGTH(TRIM(numero_documento)) ASC, numero_documento ASC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&rows).Error
	return rows, total, err
}
