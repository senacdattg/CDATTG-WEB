package services

import "testing"

func TestListaTieneRolInstructor(t *testing.T) {
	if listaTieneRolInstructor([]string{"APRENDIZ"}) {
		t.Fatal("no tiene INSTRUCTOR")
	}
	if !listaTieneRolInstructor([]string{"APRENDIZ", "INSTRUCTOR"}) {
		t.Fatal("sí tiene INSTRUCTOR")
	}
}
