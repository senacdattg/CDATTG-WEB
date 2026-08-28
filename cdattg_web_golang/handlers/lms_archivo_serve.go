package handlers

import (
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/services"
)

// servirArchivoLMS abre el PDF en el navegador; el resto se descarga.
// Lo pongo aquí porque FileAttachment obligaba a guardar el archivo.
func servirArchivoLMS(c *gin.Context, ruta, nombre string) {
	if !services.EsNombrePdfLMS(nombre) {
		c.FileAttachment(ruta, nombre)
		return
	}
	seguro := strings.ReplaceAll(filepath.Base(nombre), `"`, "")
	seguro = strings.ReplaceAll(seguro, "\r", "")
	seguro = strings.ReplaceAll(seguro, "\n", "")
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", `inline; filename="`+seguro+`"`)
	c.Header("X-Content-Type-Options", "nosniff")
	c.File(ruta)
}
