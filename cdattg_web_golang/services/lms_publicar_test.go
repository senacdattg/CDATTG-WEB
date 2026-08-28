package services

import (
	"testing"
	"time"
)

func TestParsePlazoEntregaLMSVacio(t *testing.T) {
	if _, err := ParsePlazoEntregaLMS("  "); err == nil {
		t.Fatal("vacío debe exigir plazo")
	}
}

func TestExigirPlazoLMS(t *testing.T) {
	if err := exigirPlazoLMS(nil); err == nil {
		t.Fatal("nil debe exigir plazo")
	}
	ahora := time.Now()
	if err := exigirPlazoLMS(&ahora); err != nil {
		t.Fatal(err)
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
