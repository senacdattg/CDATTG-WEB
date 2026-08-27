package models

import "testing"

func TestLmsTipoActividadValido(t *testing.T) {
	if !LmsTipoActividadValido(LmsActividadTrabajo) {
		t.Fatal("TRABAJO debe ser válido")
	}
	if LmsTipoActividadValido("OTRO") {
		t.Fatal("OTRO no debe ser válido")
	}
}
