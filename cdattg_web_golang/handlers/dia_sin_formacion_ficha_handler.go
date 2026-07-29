package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

type DiaSinFormacionFichaHandler struct {
	svc *services.DiaSinFormacionFichaService
}

func NewDiaSinFormacionFichaHandler() *DiaSinFormacionFichaHandler {
	return &DiaSinFormacionFichaHandler{svc: services.NewDiaSinFormacionFichaService()}
}

func (h *DiaSinFormacionFichaHandler) List(c *gin.Context) {
	var fichaID *uint
	if s := c.Query("ficha_id"); s != "" {
		if id, err := strconv.ParseUint(s, 10, 32); err == nil {
			u := uint(id)
			fichaID = &u
		}
	}
	list, err := h.svc.List(fichaID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

func (h *DiaSinFormacionFichaHandler) Create(c *gin.Context) {
	var req dto.DiaSinFormacionFichaCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID := c.GetUint("user_id")
	resp, err := h.svc.Create(userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": resp})
}

func (h *DiaSinFormacionFichaHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Día sin formación por ficha eliminado"})
}
