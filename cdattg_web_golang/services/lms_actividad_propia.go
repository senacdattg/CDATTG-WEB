// Este archivo deja a quien publica ver solo lo que él creó.
// Lo hice porque coordinador o admin seguían viendo y calificando
// lo de otros instructores. El aprendiz sí ve las de todos.
// Lo usan GetAula, GetActividad, editar, calificar y descargar.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/models"
)

var errLmsActividadAjena = errors.New("actividad no encontrada")

// actividadEsDelUsuario true si este usuario la publicó.
func actividadEsDelUsuario(act *models.LmsActividad, userID uint) bool {
	return act != nil && act.UserCreateID != nil && *act.UserCreateID == userID
}

// filtrarActividadesDelInstructor si soloPropias, deja las que publicó este usuario.
func filtrarActividadesDelInstructor(acts []models.LmsActividad, userID uint, soloPropias bool) []models.LmsActividad {
	// El aprendiz recibe la lista completa del aula.
	if !soloPropias {
		return acts
	}
	// Quien publica (instructor, coordinador o admin) solo ve lo suyo.
	out := make([]models.LmsActividad, 0, len(acts))
	for i := range acts {
		if actividadEsDelUsuario(&acts[i], userID) {
			out = append(out, acts[i])
		}
	}
	return out
}

// exigirInstructorSoloSuActividad el aprendiz pasa; quien publica no toca lo ajeno.
func exigirInstructorSoloSuActividad(puedePublicar bool, act *models.LmsActividad, userID uint) error {
	if !puedePublicar {
		return nil
	}
	if actividadEsDelUsuario(act, userID) {
		return nil
	}
	return errLmsActividadAjena
}

// actividadVisibleEnFicha carga la actividad y la oculta si es de otro instructor.
func (s *lmsAulaService) actividadVisibleEnFicha(
	user *models.User, fichaID, actividadID uint, roles []string,
) (*models.LmsActividad, error) {
	act, err := s.actividadDeFicha(fichaID, actividadID)
	if err != nil {
		return nil, err
	}
	puede := s.acceso.puedePublicar(user, fichaID, roles)
	if err := exigirInstructorSoloSuActividad(puede, act, user.ID); err != nil {
		return nil, err
	}
	return act, nil
}
