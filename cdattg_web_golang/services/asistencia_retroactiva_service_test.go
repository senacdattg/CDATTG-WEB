package services

import (
	"testing"
	"time"
)

func TestValidarFechaRetroactiva_rechazaHoyYFuturo(t *testing.T) {
	loc := time.Local
	hoy := time.Now().In(loc)
	if err := validarFechaRetroactiva(hoy); err == nil {
		t.Fatal("esperaba error para hoy")
	}
	maniana := hoy.AddDate(0, 0, 1)
	if err := validarFechaRetroactiva(maniana); err == nil {
		t.Fatal("esperaba error para mañana")
	}
}

func TestValidarFechaRetroactiva_aceptaAyer(t *testing.T) {
	ayer := time.Now().AddDate(0, 0, -1)
	if err := validarFechaRetroactiva(ayer); err != nil {
		t.Fatalf("ayer debería ser válido: %v", err)
	}
}

func TestValidarFechaRetroactiva_aceptaNoventaDias(t *testing.T) {
	fecha := time.Now().AddDate(0, 0, -90)
	if err := validarFechaRetroactiva(fecha); err != nil {
		t.Fatalf("90 días atrás debería valer: %v", err)
	}
}
