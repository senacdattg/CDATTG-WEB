// Este archivo atiende las rutas de auditoría LMS.
// Lo hice para buscar carpetas y ver entregas sin pasar por el aula.
// Se relaciona con LmsAuditoriaService.
//
// @author Cristian Deysdayr Jiménez
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

// LmsAuditoriaHandler búsqueda y detalle de carpetas LMS.
type LmsAuditoriaHandler struct {
	svc services.LmsAuditoriaService
}

// NewLmsAuditoriaHandler constructor.
func NewLmsAuditoriaHandler() *LmsAuditoriaHandler {
	return &LmsAuditoriaHandler{svc: services.NewLmsAuditoriaService()}
}

// Buscar GET /lms/auditoria/personas?q=&page=
func (h *LmsAuditoriaHandler) Buscar(c *gin.Context) {
	page, errP := strconv.Atoi(c.DefaultQuery("page", "1"))
	if errP != nil {
		page = 1
	}
	list, err := h.svc.Buscar(userIDFromContext(c), c.Query("q"), page)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// ListarFicha GET /lms/auditoria/fichas/:fichaId/personas
func (h *LmsAuditoriaHandler) ListarFicha(c *gin.Context) {
	fichaID, ok := parseLmsID(c, "fichaId", "ficha inválida")
	if !ok {
		return
	}
	list, err := h.svc.ListarFicha(userIDFromContext(c), fichaID)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// Persona GET /lms/auditoria/personas/:personaId
func (h *LmsAuditoriaHandler) Persona(c *gin.Context) {
	personaID, ok := parseLmsID(c, "personaId", "persona inválida")
	if !ok {
		return
	}
	det, err := h.svc.Persona(userIDFromContext(c), personaID)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, det)
}

// Tipo GET /lms/auditoria/personas/:personaId/tipos/:tipo
func (h *LmsAuditoriaHandler) Tipo(c *gin.Context) {
	personaID, ok := parseLmsID(c, "personaId", "persona inválida")
	if !ok {
		return
	}
	det, err := h.svc.Tipo(userIDFromContext(c), personaID, c.Param("tipo"))
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, det)
}
