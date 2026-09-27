/**
 * Pruebo la salida masiva: cuerpo malo, feliz y error del servicio.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
)

func TestSalidaMasivaFelizYError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{masiva: &dto.AccesoSalidaMasivaResponse{Cerradas: 4}}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{"sede_id":2,"excluir_visita_ids":[9]}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.SalidaMasiva(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d %s", w.Code, w.Body.String())
	}

	h = &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{err: errors.New("sede")}}
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{"sede_id":2}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.SalidaMasiva(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("error %d", w.Code)
	}
}

func TestSalidaMasivaSinSede(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.SalidaMasiva(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("vacio %d", w.Code)
	}
}
