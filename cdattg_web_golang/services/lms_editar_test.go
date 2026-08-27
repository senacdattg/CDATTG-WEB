package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestAplicarEdicionActividad(t *testing.T) {
	row := models.LmsActividad{Titulo: "Viejo", Cuerpo: "x", Tipo: models.LmsActividadTablon}
	puntos := 80.0
	plazo := time.Date(2026, 8, 30, 18, 0, 0, 0, time.UTC)
	req := dto.LmsActividadRequest{Titulo: " Nuevo ", Cuerpo: " desc ", CalificacionMax: &puntos, PlazoEntrega: &plazo}
	if err := aplicarEdicionActividad(&row, req, 9); err != nil {
		t.Fatal(err)
	}
	if row.Titulo != "Nuevo" || row.Cuerpo != "desc" || row.CalificacionMax == nil || *row.CalificacionMax != 80 {
		t.Fatalf("campos %#v", row)
	}
	if row.PlazoEntrega == nil || row.UserEditID == nil || *row.UserEditID != 9 {
		t.Fatal("plazo y auditoría")
	}
	if row.Tipo != models.LmsActividadTablon {
		t.Fatal("no debe cambiar el tipo")
	}
}

func TestAplicarEdicionActividadTituloVacio(t *testing.T) {
	row := models.LmsActividad{Titulo: "Viejo"}
	if err := aplicarEdicionActividad(&row, dto.LmsActividadRequest{Titulo: "  "}, 1); err == nil {
		t.Fatal("título vacío debe fallar")
	}
}

func TestAplicarEdicionActividadQuitaPlazo(t *testing.T) {
	antes := time.Date(2026, 8, 30, 18, 0, 0, 0, time.UTC)
	row := models.LmsActividad{Titulo: "A", PlazoEntrega: &antes}
	if err := aplicarEdicionActividad(&row, dto.LmsActividadRequest{Titulo: "A"}, 2); err != nil {
		t.Fatal(err)
	}
	if row.PlazoEntrega != nil {
		t.Fatal("sin plazo en el request debe quedar nil")
	}
}
