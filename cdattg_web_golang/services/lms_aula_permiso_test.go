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

func TestLmsPuedeEntrarConsulta(t *testing.T) {
	if !lmsPuedeEntrar(false, true, false) {
		t.Fatal("asignado inactivo entra a ver")
	}
	if lmsPuedeEntrar(false, false, false) {
		t.Fatal("sin vínculo no entra")
	}
}


func TestLmsPuedeVerHistorial(t *testing.T) {
	if !lmsPuedeVerHistorial(true, false) {
		t.Fatal("instructor ve historial")
	}
	if !lmsPuedeVerHistorial(false, true) {
		t.Fatal("superadmin ve historial")
	}
	if lmsPuedeVerHistorial(false, false) {
		t.Fatal("aprendiz no ve historial")
	}
}

func TestLmsEsSuperAdmin(t *testing.T) {
	if !lmsEsSuperAdmin([]string{"SUPER ADMINISTRADOR"}) {
		t.Fatal("sí es superadmin")
	}
	if lmsEsSuperAdmin([]string{"ADMINISTRADOR", "COORDINADOR"}) {
		t.Fatal("admin no es superadmin")
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
