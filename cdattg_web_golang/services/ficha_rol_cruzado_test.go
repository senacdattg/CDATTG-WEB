package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestAprendizActivoDeFicha(t *testing.T) {
	if aprendizActivoDeFicha(nil) {
		t.Fatal("sin matrícula no es aprendiz activo")
	}
	if !aprendizActivoDeFicha(&models.Aprendiz{Estado: true}) {
		t.Fatal("activo sí cuenta")
	}
	if aprendizActivoDeFicha(&models.Aprendiz{Estado: false}) {
		t.Fatal("desasignado no cuenta")
	}
}

func TestErrSiAprendizQuiereSerInstructor(t *testing.T) {
	if err := errSiAprendizQuiereSerInstructor(nil); err != nil {
		t.Fatal(err)
	}
	if err := errSiAprendizQuiereSerInstructor(&models.Aprendiz{Estado: false}); err != nil {
		t.Fatal(err)
	}
	if err := errSiAprendizQuiereSerInstructor(&models.Aprendiz{Estado: true}); err != ErrAprendizEInstructorMismaFicha {
		t.Fatal("debe bloquear al aprendiz activo")
	}
}

func TestErrSiInstructorQuiereSerAprendiz(t *testing.T) {
	if err := errSiInstructorQuiereSerAprendiz(false); err != nil {
		t.Fatal(err)
	}
	if err := errSiInstructorQuiereSerAprendiz(true); err != ErrInstructorEAprendizMismaFicha {
		t.Fatal("debe bloquear al instructor de la ficha")
	}
}

func TestPuedeSerInstructorDeFicha(t *testing.T) {
	if !puedeSerInstructorDeFicha(nil, true) {
		t.Fatal("instructor sin matrícula de aprendiz sí publica")
	}
	if puedeSerInstructorDeFicha(&models.Aprendiz{Estado: true}, true) {
		t.Fatal("aprendiz activo no puede ser instructor de la misma ficha")
	}
	if puedeSerInstructorDeFicha(nil, false) {
		t.Fatal("sin asignación no es instructor")
	}
}
