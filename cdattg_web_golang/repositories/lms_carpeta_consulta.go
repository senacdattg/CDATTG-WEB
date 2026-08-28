// Este archivo busca carpetas LMS por cédula, nombre o ficha.
// Lo hice porque la auditoría no podía listar personas sin recorrer la lista.
// Lo usa LmsAuditoriaService.
//
// @author Cristian Deysdayr Jiménez
package repositories

import "github.com/sena/cdattg-web-golang/models"

const lmsAuditoriaLimiteDefault = 50

// SearchPersonas filtra la carpeta raíz por documento, nombre o número de ficha.
func (r *lmsCarpetaRepository) SearchPersonas(q string, limite int, soloFichaIDs []uint) ([]models.LmsCarpetaPersona, error) {
	if limite <= 0 {
		limite = lmsAuditoriaLimiteDefault
	}
	var ids []uint
	db := r.db.Model(&models.LmsCarpetaPersona{}).
		Joins("JOIN personas p ON p.id = lms_carpetas_persona.persona_id").
		Joins("LEFT JOIN lms_carpetas_ficha cf ON cf.persona_id = lms_carpetas_persona.persona_id")
	if q != "" {
		term := "%" + q + "%"
		db = db.Where(
			`p.numero_documento ILIKE ? OR p.primer_nombre ILIKE ? OR p.segundo_nombre ILIKE ? OR p.primer_apellido ILIKE ? OR p.segundo_apellido ILIKE ? OR lms_carpetas_persona.nombre_carpeta ILIKE ? OR cf.numero_ficha ILIKE ?`,
			term, term, term, term, term, term, term,
		)
	}
	if soloFichaIDs != nil {
		db = db.Where("cf.ficha_id IN ?", soloFichaIDs)
	}
	if err := db.Distinct("lms_carpetas_persona.id").Limit(limite).Pluck("lms_carpetas_persona.id", &ids).Error; err != nil {
		return nil, err
	}
	if len(ids) == 0 {
		return []models.LmsCarpetaPersona{}, nil
	}
	var list []models.LmsCarpetaPersona
	err := r.db.Preload("Persona").Where("id IN ?", ids).Order("nombre_carpeta").Find(&list).Error
	return list, err
}

// ListFichasByPersona carpetas de ficha que ya se crearon para esa persona.
func (r *lmsCarpetaRepository) ListFichasByPersona(personaID uint) ([]models.LmsCarpetaFicha, error) {
	var list []models.LmsCarpetaFicha
	err := r.db.Where("persona_id = ?", personaID).Order("numero_ficha").Find(&list).Error
	return list, err
}
