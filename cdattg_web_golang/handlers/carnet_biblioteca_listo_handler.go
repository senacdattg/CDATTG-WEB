/**
 * Marco o quito “listo” en un carnet regular de biblioteca.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type carnetListoBody struct {
	Listo *bool `json:"listo"`
}

// MarcarListoBiblioteca POST /carnets/biblioteca/:id/listo
func (h *CarnetHandler) MarcarListoBiblioteca(c *gin.Context) {
	id, ok := idDeRutaCarnet(c)
	if !ok {
		return
	}
	var body carnetListoBody
	if err := c.ShouldBindJSON(&body); err != nil || body.Listo == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "indique si quedó listo"})
		return
	}
	if err := h.svc.MarcarListoBiblioteca(id, *body.Listo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true, "listo": *body.Listo})
}
