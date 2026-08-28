package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestLmsTextoAuditoria(t *testing.T) {
	if lmsTextoAuditoria("  1120%_  ") != "1120" {
		t.Fatal("debe quitar espacios y comodines")
	}
	if lmsTextoAuditoria("") != "" {
		t.Fatal("vacío se queda vacío")
	}
	if lmsTextoAuditoria("1 120 955821") != "1120955821" {
		t.Fatal("cédula con espacios se junta")
	}
}

func TestLmsTipoAuditoriaValido(t *testing.T) {
	if !lmsTipoAuditoriaValido(models.TipoFormacionRegular) {
		t.Fatal("regular es válido")
	}
	if lmsTipoAuditoriaValido("OTRO") {
		t.Fatal("tipo inventado no vale")
	}
}

func TestLmsTiposAuditoriaSiempreTres(t *testing.T) {
	got := lmsTiposAuditoria(nil)
	if len(got) != 3 {
		t.Fatal("siempre hay tres carpetas de tipo")
	}
	if got[0].NombreCarpeta == "" || got[1].NombreCarpeta == "" || got[2].NombreCarpeta == "" {
		t.Fatal("cada tipo tiene nombre de carpeta")
	}
}

func TestLmsEsNumeroFicha(t *testing.T) {
	if lmsEsNumeroFicha("12") {
		t.Fatal("muy corto no es ficha")
	}
	if !lmsEsNumeroFicha("3173334") {
		t.Fatal("número de ficha sí")
	}
	if lmsEsNumeroFicha("ANA") {
		t.Fatal("nombre no es ficha")
	}
}

func TestLmsPaginaAuditoria(t *testing.T) {
	if lmsPaginaAuditoria(0) != 1 || lmsPaginaAuditoria(-3) != 1 {
		t.Fatal("página inválida queda en 1")
	}
	if lmsPaginaAuditoria(4) != 4 {
		t.Fatal("página válida se respeta")
	}
}
