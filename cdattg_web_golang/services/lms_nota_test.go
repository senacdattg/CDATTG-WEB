package services

import (
	"testing"
	"time"
)

func TestValidarNotaLMS(t *testing.T) {
	if err := ValidarNotaLMS(nil); err != nil {
		t.Fatal("nil debe ser válido")
	}
	ok := 80.0
	if err := ValidarNotaLMS(&ok); err != nil {
		t.Fatal("80 debe ser válida")
	}
	cero := 0.0
	if err := ValidarNotaLMS(&cero); err != nil {
		t.Fatal("0 debe ser válida")
	}
	cien := 100.0
	if err := ValidarNotaLMS(&cien); err != nil {
		t.Fatal("100 debe ser válida")
	}
	mal := 101.0
	if err := ValidarNotaLMS(&mal); err == nil {
		t.Fatal("101 no debe ser válida")
	}
}

func TestParsePuntosLMS(t *testing.T) {
	def, err := ParsePuntosLMS("")
	if err != nil || def == nil || *def != 100 {
		t.Fatal("vacío debe ser 100")
	}
	ochenta, err := ParsePuntosLMS("80")
	if err != nil || ochenta == nil || *ochenta != 80 {
		t.Fatal("80 debe aceptarse")
	}
	if _, err := ParsePuntosLMS("120"); err == nil {
		t.Fatal("120 no debe aceptarse")
	}
}

func TestEntregaEsTardia(t *testing.T) {
	plazo := time.Date(2026, 8, 11, 23, 0, 0, 0, time.UTC)
	antes := time.Date(2026, 8, 11, 22, 0, 0, 0, time.UTC)
	despues := time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC)
	if EntregaEsTardia(antes, &plazo) {
		t.Fatal("antes del plazo no es tardía")
	}
	if !EntregaEsTardia(despues, &plazo) {
		t.Fatal("después del plazo es tardía")
	}
	if EntregaEsTardia(despues, nil) {
		t.Fatal("sin plazo no es tardía")
	}
}
