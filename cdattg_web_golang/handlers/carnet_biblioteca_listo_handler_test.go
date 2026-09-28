/**
 * Pruebo marcar listo: cuerpo malo, feliz y error del servicio.
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
)

func TestMarcarListoBibliotecaFelizYError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "4"}}
	c.Request = httptest.NewRequest(http.MethodPost, "/api/carnets/biblioteca/4/listo", bytes.NewBufferString(`{"listo":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.MarcarListoBiblioteca(c)
	if w.Code != http.StatusOK {
		t.Fatalf("feliz %d %s", w.Code, w.Body.String())
	}

	h = NewCarnetHandlerWithService(&mockCarnetSvc{err: errors.New("no")})
	w = httptest.NewRecorder()
	c, _ = gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "4"}}
	c.Request = httptest.NewRequest(http.MethodPost, "/api/carnets/biblioteca/4/listo", bytes.NewBufferString(`{"listo":true}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.MarcarListoBiblioteca(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("error %d", w.Code)
	}
}

func TestMarcarListoBibliotecaSinCuerpo(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := NewCarnetHandlerWithService(&mockCarnetSvc{})
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Params = gin.Params{{Key: "id", Value: "4"}}
	c.Request = httptest.NewRequest(http.MethodPost, "/api/carnets/biblioteca/4/listo", bytes.NewBufferString(`{}`))
	c.Request.Header.Set("Content-Type", "application/json")
	h.MarcarListoBiblioteca(c)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("vacio %d", w.Code)
	}
}
