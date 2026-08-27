package handlers

import (
	"errors"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

const lmsMultipartMax = 12 << 20

var errDatosInvalidos = errors.New("datos inválidos")

// CreateActividad POST /lms/aulas/:fichaId/actividades (multipart o JSON).
func (h *LmsHandler) CreateActividad(c *gin.Context) {
	fichaID, ok := parseFichaIDParam(c)
	if !ok {
		return
	}
	req, files, err := parseLmsActividadForm(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.CreateActividad(userIDFromContext(c), fichaID, req, files)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// UpdateActividad PUT /lms/aulas/:fichaId/actividades/:actividadId (multipart o JSON).
func (h *LmsHandler) UpdateActividad(c *gin.Context) {
	fichaID, actividadID, ok := parseFichaYActividad(c)
	if !ok {
		return
	}
	req, files, err := parseLmsActividadForm(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	item, err := h.svc.UpdateActividad(userIDFromContext(c), fichaID, actividadID, req, files)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, item)
}

// DescargarArchivo GET /lms/aulas/:fichaId/actividades/:actividadId/archivos/:archivoId
func (h *LmsHandler) DescargarArchivo(c *gin.Context) {
	fichaID, ok := parseFichaIDParam(c)
	if !ok {
		return
	}
	actividadID, ok := parseLmsID(c, "actividadId", "actividad inválida")
	if !ok {
		return
	}
	archivoID, ok := parseLmsID(c, "archivoId", "archivo inválido")
	if !ok {
		return
	}
	row, err := h.svc.DescargarArchivo(userIDFromContext(c), fichaID, actividadID, archivoID)
	if err != nil {
		c.JSON(lmsStatusFromErr(err), gin.H{"error": err.Error()})
		return
	}
	c.FileAttachment(row.RutaRelativa, row.NombreOriginal)
}

func parseLmsActividadForm(c *gin.Context) (dto.LmsActividadRequest, []*multipart.FileHeader, error) {
	if strings.HasPrefix(c.ContentType(), "multipart/form-data") {
		return parseLmsMultipart(c)
	}
	var req dto.LmsActividadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		return req, nil, errDatosInvalidos
	}
	return req, nil, nil
}

func parseLmsMultipart(c *gin.Context) (dto.LmsActividadRequest, []*multipart.FileHeader, error) {
	var req dto.LmsActividadRequest
	if err := c.Request.ParseMultipartForm(lmsMultipartMax); err != nil {
		return req, nil, errDatosInvalidos
	}
	req.Titulo = c.PostForm("titulo")
	req.Cuerpo = c.PostForm("cuerpo")
	puntos, errPts := services.ParsePuntosLMS(c.PostForm("calificacion_max"))
	if errPts != nil {
		return req, nil, errPts
	}
	req.CalificacionMax = puntos
	plazo, err := services.ParsePlazoEntregaLMS(c.PostForm("plazo_entrega"))
	if err != nil {
		return req, nil, err
	}
	req.PlazoEntrega = plazo
	form := c.Request.MultipartForm
	if form == nil {
		return req, nil, nil
	}
	return req, form.File["archivos"], nil
}
