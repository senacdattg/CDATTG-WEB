/**
 * Pruebo listar y borrar stubs: cuerpo malo y error del servicio.
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

func TestListPersonasSinNombreError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{err: errors.New("x")}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/x", nil)
	h.ListPersonasSinNombre(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("code %d", w.Code)
	}
}

func TestBorrarPersonasSinNombreCuerpoMalo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockVigAccesoFoto{}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.BorrarPersonasSinNombre(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("json %d", w.Code)
	}
}

func TestBorrarPersonasSinNombreFeliz(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &VigilanciaAccesoHandler{svc: &mockBorrarStubsOK{}}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/x", bytes.NewBufferString(`{"ids":[1],"confirmado":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.BorrarPersonasSinNombre(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d %s", w.Code, w.Body.String())
	}
}

type mockBorrarStubsOK struct{ mockVigAccesoFoto }

func (m *mockBorrarStubsOK) BorrarPersonasSinNombre(dto.AccesoBorrarStubsRequest) (*dto.AccesoBorrarStubsResponse, error) {
	return &dto.AccesoBorrarStubsResponse{Eliminados: 1}, nil
}
