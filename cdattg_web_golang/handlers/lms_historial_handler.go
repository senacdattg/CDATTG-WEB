// Este archivo atiende el historial de calificaciones del aula.
// Lo hice para listar notas de toda la ficha en una sola ruta.
// Se relaciona con LmsAulaService.HistorialCalificaciones.
//
// @author Cristian Deysdayr Jiménez
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HistorialCalificaciones GET /lms/aulas/:fichaId/calificaciones
func (h *LmsHandler) HistorialCalificaciones(c *gin.Context) {
	fichaID, ok := parseFichaIDParam(c)
	if !ok {
		return
	}
	list, err := h.svc.HistorialCalificaciones(userIDFromContext(c), fichaID)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}
