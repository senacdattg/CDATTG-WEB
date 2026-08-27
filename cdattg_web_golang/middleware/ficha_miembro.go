/**
 * middleware: pertenencia a ficha para lectura (LMS overlay sin duplicar APIs).
 * @author CRANDEYS
 * @created 2026-08-26
 */
package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

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
