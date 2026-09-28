/**
 * Pruebo el ZIP y el borrado de visitas de portería.
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

func TestZipExcelRegistrosFelizYError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{zip: []byte("PK")}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/x?fecha_desde=2026-01-01", nil)
	h.ZipExcelRegistros(c)
	if w.Code != http.StatusOK {
		t.Fatalf("zip %d", w.Code)
	}
	h = &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{err: errors.New("f")}}
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/x", nil)
	h.ZipExcelRegistros(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("err %d", w.Code)
	}
}

func TestBorrarRegistrosFelizYCuerpoMalo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{borrado: &dto.AccesoBorrarResponse{Eliminados: 3}}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{"descarga_ok":true,"confirmacion_1":"ELIMINAR","confirmacion_2":"ELIMINAR","fecha_hasta":"2026-01-01"}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.BorrarRegistros(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d %s", w.Code, w.Body.String())
	}
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.BorrarRegistros(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("json %d", w.Code)
	}
	h = &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{err: errors.New("frase")}}
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{"descarga_ok":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.BorrarRegistros(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("svc %d", w.Code)
	}
}
