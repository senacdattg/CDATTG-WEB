// Este archivo carga el historial de notas del aula.
// Lo hice para no mezclar esa lista con el tablón ni con Mis actividades.
// Lo usa GET /lms/aulas/:fichaId/calificaciones.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/dto"

// HistorialCalificaciones notas de todos los aprendices en las actividades propias.
func (s *lmsAulaService) HistorialCalificaciones(userID, fichaID uint) ([]dto.LmsHistorialFila, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirVerHistorial(user, fichaID, roles); err != nil {
		return nil, err
	}
	aps, errA := s.aprendices.FindByFichaID(fichaID)
	if errA != nil {
		return nil, errA
	}
	acts, errB := s.actividades.FindByFichaID(fichaID)
	if errB != nil {
		return nil, errB
	}
	acts = filtrarActividadesDelInstructor(acts, user.ID, s.acceso.puedePublicar(user, fichaID, roles))
	ents, errC := s.entregas.FindByActividadIDs(idsDeActividades(acts))
	if errC != nil {
		return nil, errC
	}
	return armarFilasHistorial(aps, acts, ents), nil
}
