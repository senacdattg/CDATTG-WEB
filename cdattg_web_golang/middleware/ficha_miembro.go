/**
 * middleware: pertenencia a ficha para lectura (LMS overlay sin duplicar APIs).
 * @author Cristian Deysdayr Jiménez
 */
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// tryFallbackLmsConsulta deja ver aulas si ya no tiene rol INSTRUCTOR pero sigue asignado.
func tryFallbackLmsConsulta(c *gin.Context, obj, act string) bool {
	if obj != authz.ObjLMS {
		return false
	}
	if act == authz.ActVerLMS {
		return usuarioTieneAulaLMS(c)
	}
	if act == authz.ActEntrarAulaLMS {
		fichaID, ok := uintFromParam(c, "fichaId")
		return ok && usuarioPuedeVerFichaComoMiembro(c, fichaID)
	}
	return false
}

// usuarioTieneAulaLMS hay ficha como instructor asignado o como aprendiz.
func usuarioTieneAulaLMS(c *gin.Context) bool {
	u, ok := c.Get("user")
	if !ok {
		return false
	}
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		return false
	}
	instRepo := repositories.NewInstructorRepository()
	if inst, err := instRepo.FindByPersonaID(*user.PersonaID); err == nil && inst != nil {
		list, errList := repositories.NewInstructorFichaRepository().FindByInstructorID(inst.ID)
		if errList == nil && len(list) > 0 {
			return true
		}
	}
	mats, err := repositories.NewAprendizRepository().FindActivosByPersonaID(*user.PersonaID)
	return err == nil && len(mats) > 0
}

// usuarioPuedeVerFichaComoMiembro es instructor asignado o aprendiz de la ficha (LMS / overlay).
func usuarioPuedeVerFichaComoMiembro(c *gin.Context, fichaID uint) bool {
	return instructorTieneFichaAsignada(c, fichaID) || aprendizTieneFicha(c, fichaID)
}

// aprendizTieneFicha indica si el usuario autenticado está matriculado en la ficha.
func aprendizTieneFicha(c *gin.Context, fichaID uint) bool {
	u, ok := c.Get("user")
	if !ok {
		return false
	}
	user, _ := u.(*models.User)
	if user == nil || user.PersonaID == nil {
		return false
	}
	repo := repositories.NewAprendizRepository()
	_, err := repo.FindByPersonaIDAndFichaID(*user.PersonaID, fichaID)
	return err == nil
}
