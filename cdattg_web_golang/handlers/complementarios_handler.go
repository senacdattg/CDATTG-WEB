package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/services"
)

// ComplementariosHandler expone credenciales SofiaPlus y verificación de aspirantes (módulo FPI).
type ComplementariosHandler struct {
	svc *services.ComplementariosService
}

func NewComplementariosHandler() *ComplementariosHandler {
	return &ComplementariosHandler{svc: services.NewComplementariosService()}
}

// usuarioIDDeContexto obtiene el id del usuario autenticado (lo pone AuthMiddleware).
func usuarioIDDeContexto(c *gin.Context) (uint, bool) {
	v, ok := c.Get("userID")
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok
}

// GetCredencialEstado GET /complementarios/credenciales
func (h *ComplementariosHandler) GetCredencialEstado(c *gin.Context) {
	userID, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.ObtenerEstado(userID)})
}

// GuardarCredencial POST /complementarios/credenciales
func (h *ComplementariosHandler) GuardarCredencial(c *gin.Context) {
	userID, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	var req dto.GuardarCredencialSofiaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.svc.GuardarCredencial(userID, req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.ObtenerEstado(userID)})
}

// EliminarCredencial DELETE /complementarios/credenciales
func (h *ComplementariosHandler) EliminarCredencial(c *gin.Context) {
	userID, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	if err := h.svc.EliminarCredencial(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"eliminado": true}})
}

// VerificarAspirante POST /complementarios/verificar-aspirante
// Consulta un documento en SofiaPlus con las credenciales del operador. Puede tardar varios segundos.
func (h *ComplementariosHandler) VerificarAspirante(c *gin.Context) {
	userID, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	var req dto.VerificarAspiranteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.VerificarAspirante(userID, req)})
}

// DescargarPlantilla GET /complementarios/plantilla
func (h *ComplementariosHandler) DescargarPlantilla(c *gin.Context) {
	data, err := h.svc.PlantillaLote()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=plantilla_verificacion_aspirantes.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data)
}

// VerificarLote POST /complementarios/verificar-lote (multipart: file)
func (h *ComplementariosHandler) VerificarLote(c *gin.Context) {
	userID, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "falta el archivo Excel (campo 'file')"})
		return
	}
	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no se pudo abrir el archivo"})
		return
	}
	defer func() { _ = f.Close() }()

	contenido, err := io.ReadAll(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no se pudo leer el archivo"})
		return
	}

	res, err := h.svc.VerificarLote(userID, contenido)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

// VerificarAspiranteBetowa POST /complementarios/betowa/verificar-aspirante
func (h *ComplementariosHandler) VerificarAspiranteBetowa(c *gin.Context) {
	_, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	var req dto.VerificarAspiranteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": h.svc.VerificarAspiranteBetowa(req)})
}

// VerificarLoteBetowa POST /complementarios/betowa/verificar-lote (multipart: file)
func (h *ComplementariosHandler) VerificarLoteBetowa(c *gin.Context) {
	_, ok := usuarioIDDeContexto(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "no autenticado"})
		return
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "falta el archivo Excel (campo 'file')"})
		return
	}
	f, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no se pudo abrir el archivo"})
		return
	}
	defer func() { _ = f.Close() }()

	contenido, err := io.ReadAll(f)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no se pudo leer el archivo"})
		return
	}

	res, err := h.svc.VerificarLoteBetowa(contenido)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}
