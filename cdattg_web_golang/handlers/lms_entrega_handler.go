package handlers

import (
	"mime/multipart"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
)

// GetActividad GET /lms/aulas/:fichaId/actividades/:actividadId
func (h *LmsHandler) GetActividad(c *gin.Context) {
	fichaID, actividadID, ok := parseFichaYActividad(c)
	if !ok {
		return
	}
	det, err := h.svc.GetActividad(userIDFromContext(c), fichaID, actividadID)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, det)
}

// Entregar POST /lms/aulas/:fichaId/actividades/:actividadId/entregas
func (h *LmsHandler) Entregar(c *gin.Context) {
	fichaID, actividadID, ok := parseFichaYActividad(c)
	if !ok {
		return
	}
	if err := c.Request.ParseMultipartForm(lmsMultipartMax); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}
	var headers []*multipart.FileHeader
	if c.Request.MultipartForm != nil {
		headers = c.Request.MultipartForm.File["archivos"]
	}
	item, err := h.svc.Entregar(userIDFromContext(c), fichaID, actividadID, headers)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// DeshacerEntrega POST .../entregas/deshacer
func (h *LmsHandler) DeshacerEntrega(c *gin.Context) {
	fichaID, actividadID, ok := parseFichaYActividad(c)
	if !ok {
		return
	}
	item, err := h.svc.DeshacerEntrega(userIDFromContext(c), fichaID, actividadID)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// Calificar PUT /lms/aulas/:fichaId/actividades/:actividadId/entregas/:entregaId/nota
func (h *LmsHandler) Calificar(c *gin.Context) {
	fichaID, actividadID, ok := parseFichaYActividad(c)
	if !ok {
		return
	}
	entregaID, ok := parseLmsID(c, "entregaId", "entrega inválida")
	if !ok {
		return
	}
	var req dto.LmsNotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}
	item, err := h.svc.Calificar(userIDFromContext(c), fichaID, actividadID, entregaID, req)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DescargarArchivoEntrega GET .../entregas/:entregaId/archivos/:archivoId
func (h *LmsHandler) DescargarArchivoEntrega(c *gin.Context) {
	fichaID, actividadID, ok := parseFichaYActividad(c)
	if !ok {
		return
	}
	entregaID, ok := parseLmsID(c, "entregaId", "entrega inválida")
	if !ok {
		return
	}
	archivoID, ok := parseLmsID(c, "archivoId", "archivo inválido")
	if !ok {
		return
	}
	row, err := h.svc.DescargarArchivoEntrega(userIDFromContext(c), fichaID, actividadID, entregaID, archivoID)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	servirArchivoLMS(c, row.RutaRelativa, row.NombreOriginal)
}

func parseFichaYActividad(c *gin.Context) (uint, uint, bool) {
	fichaID, ok := parseFichaIDParam(c)
	if !ok {
		return 0, 0, false
	}
	actividadID, ok := parseLmsID(c, "actividadId", "actividad inválida")
	if !ok {
		return 0, 0, false
	}
	return fichaID, actividadID, true
}
