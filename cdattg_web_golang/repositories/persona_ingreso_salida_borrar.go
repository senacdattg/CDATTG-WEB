/**
 * Listo y borro visitas de portería por filtro, sin tocar personas.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import "github.com/sena/cdattg-web-golang/models"

func idsUnicosAcceso(ids []uint) []uint {
	visto := map[uint]struct{}{}
	out := make([]uint, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := visto[id]; ok {
			continue
		}
		visto[id] = struct{}{}
		out = append(out, id)
	}
	return out
}

func (r *personaIngresoSalidaRepository) ListTodosHistorial(q AccesoHistorialQuery) ([]models.PersonaIngresoSalida, error) {
	var rows []models.PersonaIngresoSalida
	err := r.baseQuery(q).
		Select("persona_ingreso_salida.*").
		Preload("Persona").
		Preload("Sede").
		Order("persona_ingreso_salida.timestamp_entrada DESC").
		Find(&rows).Error
	return rows, err
}

func (r *personaIngresoSalidaRepository) DeleteByQuery(q AccesoHistorialQuery) (int64, error) {
	var ids []uint
	if err := r.baseQuery(q).Pluck("persona_ingreso_salida.id", &ids).Error; err != nil {
		return 0, err
	}
	ids = idsUnicosAcceso(ids)
	if len(ids) == 0 {
		return 0, nil
	}
	res := r.db.Where("id IN ?", ids).Delete(&models.PersonaIngresoSalida{})
	return res.RowsAffected, res.Error
}

func (r *personaIngresoSalidaRepository) DeleteHardByPersonaID(personaID uint) error {
	return r.db.Unscoped().Where("persona_id = ?", personaID).Delete(&models.PersonaIngresoSalida{}).Error
}
