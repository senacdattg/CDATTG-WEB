// Este archivo elimina una actividad que el instructor publicó.
// Lo hice para el CRUD de Mis actividades: crear está en Publicar; aquí se borra.
// Lo usa DELETE /lms/aulas/:fichaId/actividades/:actividadId.
//
// @author Cristian Deysdayr Jiménez
package services

import "os"

// DeleteActividad quita la publicación propia, entregas y carpetas en disco.
func (s *lmsAulaService) DeleteActividad(userID, fichaID, actividadID uint) error {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return err
	}
	if err := s.acceso.exigirPublicar(user, fichaID, roles); err != nil {
		return err
	}
	row, err := s.actividadDeFicha(fichaID, actividadID)
	if err != nil {
		return err
	}
	if err := exigirInstructorSoloSuActividad(true, row, user.ID); err != nil {
		return err
	}
	if err := s.actividades.DeleteConRelaciones(actividadID); err != nil {
		return err
	}
	borrarCarpetasActividad(fichaID, actividadID)
	return nil
}

func borrarCarpetasActividad(fichaID, actividadID uint) {
	_ = os.RemoveAll(RutaPublicacionLMS(fichaID, actividadID))
	_ = os.RemoveAll(RutaEntregasActividadLMS(fichaID, actividadID))
}
