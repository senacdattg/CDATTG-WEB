// Este archivo atiende el borrado de una publicación LMS.
// Lo hice para no mezclar DELETE con el alta y la edición en el mismo archivo.
// Se relaciona con LmsAulaService.DeleteActividad.
//
// @author Cristian Deysdayr Jiménez
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// DeleteActividad DELETE /lms/aulas/:fichaId/actividades/:actividadId
func (h *LmsHandler) DeleteActividad(c *gin.Context) {
	fichaID, actividadID, ok := parseFichaYActividad(c)
	if !ok {
		return
	}
	if err := h.svc.DeleteActividad(userIDFromContext(c), fichaID, actividadID); err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
