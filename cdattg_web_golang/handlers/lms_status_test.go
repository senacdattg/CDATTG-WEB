package handlers

import (
	"net/http"
	"testing"

	"github.com/sena/cdattg-web-golang/services"
)

func TestLmsStatusFromErrSoloConsulta(t *testing.T) {
	if lmsStatusFromErr(services.ErrLmsSoloConsulta) != http.StatusForbidden {
		t.Fatal("consulta debe ser 403")
	}
	if lmsStatusFromErr(services.ErrLmsSinAcceso) != http.StatusForbidden {
		t.Fatal("sin acceso debe ser 403")
	}
	if lmsStatusFromErr(services.ErrLmsSinHistorial) != http.StatusForbidden {
		t.Fatal("sin historial debe ser 403")
	}
}
