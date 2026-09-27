/**
 * Atiendo la salida masiva de portería, sin pedir motivo.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
)

// SalidaMasiva POST /vigilancia/acceso/salida-masiva
func (h *VigilanciaAccesoHandler) SalidaMasiva(c *gin.Context) {
	var req dto.AccesoSalidaMasivaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "indique la sede"})
		return
	}
	res, err := h.svc.SalidaMasiva(req, userIDFromContext(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}
