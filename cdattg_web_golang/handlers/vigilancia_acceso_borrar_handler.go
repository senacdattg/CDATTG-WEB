/**
 * Atiendo el ZIP de respaldo y el borrado de visitas de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
)

// ZipExcelRegistros GET /vigilancia/acceso/registros/zip
func (h *VigilanciaAccesoHandler) ZipExcelRegistros(c *gin.Context) {
	f, err := filtrosDesdeQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := h.svc.ZipExcelAccesos(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", `attachment; filename="registros-acceso-porteria.zip"`)
	c.Data(http.StatusOK, "application/zip", data)
}

// BorrarRegistros POST /vigilancia/acceso/registros/borrar
func (h *VigilanciaAccesoHandler) BorrarRegistros(c *gin.Context) {
	var req dto.AccesoBorrarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "datos inválidos"})
		return
	}
	res, err := h.svc.BorrarAccesos(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}
