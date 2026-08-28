package services

import (
	"bytes"
	"io"
	"strings"
	"testing"
)

func TestEsNombrePdfLMS(t *testing.T) {
	if !EsNombrePdfLMS("tarea.PDF") {
		t.Fatal("PDF en mayúsculas debe valer")
	}
	if EsNombrePdfLMS("tarea.docx") {
		t.Fatal("docx no es pdf")
	}
}

func TestLectorPdfEntregaLMSAceptaCabecera(t *testing.T) {
	r, err := LectorPdfEntregaLMS("ev.pdf", bytes.NewReader([]byte("%PDF-1.4 hola")))
	if err != nil {
		t.Fatal(err)
	}
	got, err := io.ReadAll(r)
	if err != nil || !strings.HasPrefix(string(got), "%PDF-1.4") {
		t.Fatalf("debe devolver el archivo completo: %s %v", got, err)
	}
}

func TestLectorPdfEntregaLMSRechazaNombre(t *testing.T) {
	if _, err := LectorPdfEntregaLMS("ev.docx", bytes.NewReader([]byte("%PDF"))); err == nil {
		t.Fatal("docx no debe pasar")
	}
}

func TestLectorPdfEntregaLMSRechazaContenido(t *testing.T) {
	if _, err := LectorPdfEntregaLMS("ev.pdf", bytes.NewReader([]byte("PK\x03\x04fake"))); err == nil {
		t.Fatal("un zip con nombre pdf no debe pasar")
	}
}
