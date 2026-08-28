package handlers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestServirArchivoLMSPdfInline(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	ruta := filepath.Join(dir, "ev.pdf")
	if err := os.WriteFile(ruta, []byte("%PDF-1.4"), 0o600); err != nil {
		t.Fatal(err)
	}
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	servirArchivoLMS(c, ruta, `guia".pdf`)
	disp := w.Header().Get("Content-Disposition")
	if !strings.Contains(disp, "inline") {
		t.Fatalf("esperaba inline, hubo %q", disp)
	}
	if strings.Contains(disp, `guia".pdf`) {
		t.Fatal("no debe dejar comillas en el nombre")
	}
	if !strings.Contains(disp, "guia.pdf") {
		t.Fatal("debe conservar el nombre del pdf")
	}
	if w.Header().Get("Content-Type") != "application/pdf" {
		t.Fatal("content-type pdf")
	}
}
