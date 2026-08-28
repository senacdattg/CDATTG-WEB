package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestPersonaEnAlcanceStaff(t *testing.T) {
	list := []models.LmsCarpetaFicha{{FichaID: 21}}
	if !personaEnAlcance(list, nil) {
		t.Fatal("staff ve a cualquiera")
	}
}

func TestPersonaEnAlcanceInstructor(t *testing.T) {
	list := []models.LmsCarpetaFicha{{FichaID: 21}, {FichaID: 45}}
	if !personaEnAlcance(list, []uint{45}) {
		t.Fatal("instructor ve si comparte ficha")
	}
	if personaEnAlcance(list, []uint{99}) {
		t.Fatal("otra ficha no entra")
	}
	if personaEnAlcance(nil, []uint{21}) {
		t.Fatal("sin carpetas de ficha no entra")
	}
}

func TestFichaIDEnAlcance(t *testing.T) {
	if !fichaIDEnAlcance(9, nil) {
		t.Fatal("staff ve cualquier ficha")
	}
	if !fichaIDEnAlcance(9, []uint{1, 9}) {
		t.Fatal("instructor ve la suya")
	}
	if fichaIDEnAlcance(9, []uint{1}) {
		t.Fatal("otra ficha no entra")
	}
}

func TestAprendicesEnAlcance(t *testing.T) {
	list := []models.Aprendiz{{FichaCaracterizacionID: 3}, {FichaCaracterizacionID: 8}}
	got := aprendicesEnAlcance(list, []uint{8})
	if len(got) != 1 || got[0].FichaCaracterizacionID != 8 {
		t.Fatal("solo la matrícula de su ficha")
	}
}
