package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestLmsPuedePublicarStaffSinFicha(t *testing.T) {
	if lmsPuedePublicar(true, false, nil, false, nil) {
		t.Fatal("admin sin ficha no publica")
	}
	inst := &models.Instructor{Status: true}
	if lmsPuedePublicar(true, false, inst, false, nil) {
		t.Fatal("admin no asignado a esa ficha no publica")
	}
}

func TestLmsPuedePublicarStaffEnFicha(t *testing.T) {
	inst := &models.Instructor{Status: true}
	if !lmsPuedePublicar(true, false, inst, true, nil) {
		t.Fatal("admin asignado como instructor de la ficha sí publica")
	}
}

func TestLmsPuedePublicarInstructorVigente(t *testing.T) {
	inst := &models.Instructor{Status: true}
	if !lmsPuedePublicar(false, true, inst, true, nil) {
		t.Fatal("rol + activo + asignado debe publicar")
	}
}

func TestLmsPuedePublicarSinRolOInactivo(t *testing.T) {
	inst := &models.Instructor{Status: true}
	if lmsPuedePublicar(false, false, inst, true, nil) {
		t.Fatal("sin rol INSTRUCTOR no publica")
	}
	inst.Status = false
	if lmsPuedePublicar(false, true, inst, true, nil) {
		t.Fatal("instructor inactivo no publica")
	}
}

func TestLmsPuedePublicarAprendizMismaFicha(t *testing.T) {
	inst := &models.Instructor{Status: true}
	ap := &models.Aprendiz{Estado: true}
	if lmsPuedePublicar(false, true, inst, true, ap) {
		t.Fatal("aprendiz de la ficha no publica")
	}
	if lmsPuedePublicar(true, false, inst, true, ap) {
		t.Fatal("admin aprendiz de la ficha no publica")
	}
}

func TestListaTieneRolInstructor(t *testing.T) {
	if listaTieneRolInstructor([]string{"APRENDIZ"}) {
		t.Fatal("no tiene INSTRUCTOR")
	}
	if !listaTieneRolInstructor([]string{"APRENDIZ", "INSTRUCTOR"}) {
		t.Fatal("sí tiene INSTRUCTOR")
	}
}
