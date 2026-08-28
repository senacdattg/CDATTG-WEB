package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func uid(v uint) *uint { return &v }

func TestFiltrarActividadesDelInstructor(t *testing.T) {
	list := []models.LmsActividad{{Titulo: "mia"}, {Titulo: "otra"}}
	list[0].UserCreateID = uid(8)
	list[1].UserCreateID = uid(9)
	got := filtrarActividadesDelInstructor(list, 8, true)
	if len(got) != 1 || got[0].Titulo != "mia" {
		t.Fatal("quien publica solo ve lo suyo")
	}
	if len(filtrarActividadesDelInstructor(list, 8, false)) != 2 {
		t.Fatal("el aprendiz ve las de todos")
	}
}

func TestExigirInstructorSoloSuActividad(t *testing.T) {
	act := &models.LmsActividad{}
	act.UserCreateID = uid(8)
	if err := exigirInstructorSoloSuActividad(false, act, 9); err != nil {
		t.Fatal("el aprendiz puede ver la de cualquier instructor")
	}
	if err := exigirInstructorSoloSuActividad(true, act, 8); err != nil {
		t.Fatal("el dueño sí puede")
	}
	if err := exigirInstructorSoloSuActividad(true, act, 9); err != errLmsActividadAjena {
		t.Fatal("otro instructor no edita ni califica lo ajeno")
	}
}

func TestFiltrarActividadesSinCreador(t *testing.T) {
	list := []models.LmsActividad{{Titulo: "vieja"}}
	if n := len(filtrarActividadesDelInstructor(list, 8, true)); n != 0 {
		t.Fatalf("sin dueño el instructor no la ve, got %d", n)
	}
}
