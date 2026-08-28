package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/authz"
)

func TestTryFallbackLmsConsultaIgnoraOtros(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	if tryFallbackLmsConsulta(c, authz.ObjPersona, authz.ActVerPersona) {
		t.Fatal("no debe aplicar a persona")
	}
	if tryFallbackLmsConsulta(c, authz.ObjLMS, authz.ActPublicarActividadLMS) {
		t.Fatal("publicar no tiene consulta")
	}
}
