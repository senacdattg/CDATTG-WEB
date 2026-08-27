package services

import (
	"testing"
)

func TestLmsExtensionPermitida(t *testing.T) {
	if !LmsExtensionPermitida("guia.pdf") {
		t.Fatal("pdf debe permitirse")
	}
	if LmsExtensionPermitida("malware.exe") {
		t.Fatal("exe no debe permitirse")
	}
	if LmsExtensionPermitida("nota.HTML") {
		t.Fatal("html no debe permitirse")
	}
}

func TestRutaPublicacionYEntregaLMS(t *testing.T) {
	got := RutaPublicacionLMS(12, 4)
	want := "storage/lms/publicaciones/12/4"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	e := RutaEntregaLMS(12, 4, 9)
	if e != "storage/lms/entregas/12/4/9" {
		t.Fatalf("entrega %q", e)
	}
}

func TestErrTopeArchivosLMS(t *testing.T) {
	if err := errTopeArchivosLMS(7, 1); err != nil {
		t.Fatal("7+1 debe caber")
	}
	if err := errTopeArchivosLMS(7, 2); err == nil {
		t.Fatal("7+2 supera el máximo")
	}
	if err := errTopeArchivosLMS(8, 0); err != nil {
		t.Fatal("sin archivos nuevos debe pasar")
	}
}
