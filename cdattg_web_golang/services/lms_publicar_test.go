package services

import "testing"

func TestParsePlazoEntregaLMSVacio(t *testing.T) {
	got, err := ParsePlazoEntregaLMS("  ")
	if err != nil || got != nil {
		t.Fatal("vacío debe ser sin plazo")
	}
}

func TestParsePlazoEntregaLMSDatetimeLocal(t *testing.T) {
	got, err := ParsePlazoEntregaLMS("2026-08-30T18:00")
	if err != nil || got == nil {
		t.Fatalf("plazo válido: %v", err)
	}
	if got.Hour() != 18 {
		t.Fatalf("hora %d", got.Hour())
	}
}

func TestParsePlazoEntregaLMSInvalido(t *testing.T) {
	if _, err := ParsePlazoEntregaLMS("no-es-fecha"); err == nil {
		t.Fatal("debe rechazar plazo inválido")
	}
}
