package handlers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

// LmsHandler endpoints del módulo LMS (aulas y actividades).
type LmsHandler struct {
	svc services.LmsAulaService
}

// NewLmsHandler constructor.
func NewLmsHandler() *LmsHandler {
	return &LmsHandler{svc: services.NewLmsAulaService()}
}

// ListAulas GET /lms/aulas
func (h *LmsHandler) ListAulas(c *gin.Context) {
	list, err := h.svc.ListAulas(userIDFromContext(c))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

// GetAula GET /lms/aulas/:fichaId
func (h *LmsHandler) GetAula(c *gin.Context) {
	fichaID, ok := parseFichaIDParam(c)
	if !ok {
		return
	}
	det, err := h.svc.GetAula(userIDFromContext(c), fichaID)
	if err != nil {
		status := http.StatusForbidden
		if err.Error() == "ficha no encontrada" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, det)
}

func parseFichaIDParam(c *gin.Context) (uint, bool) {
	return parseLmsID(c, "fichaId", "ficha inválida")
}

func parseLmsID(c *gin.Context, name, msg string) (uint, bool) {
	id, err := parseUintParam(c, name)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return 0, false
	}
	return id, true
}

func lmsStatusFromErr(err error) int {
	if errors.Is(err, services.ErrLmsSinAcceso) || errors.Is(err, services.ErrLmsSinPublicar) || errors.Is(err, services.ErrLmsSoloConsulta) {
		return http.StatusForbidden
	}
	return http.StatusBadRequest
}
