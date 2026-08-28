package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestNombreCarpetaTipo(t *testing.T) {
	if NombreCarpetaTipo(models.TipoFormacionComplementaria) != "Formacion Complementaria" {
		t.Fatal("complementaria debe ir en Formacion Complementaria")
	}
	if NombreCarpetaTipo(models.TipoFormacionMediaTecnica) != "Media Tecnica" {
		t.Fatal("media tecnica mal etiquetada")
	}
	if NombreCarpetaTipo("") != "Formacion Regular" {
		t.Fatal("vacío debe ser Formación Regular")
	}
}

func TestNombreCarpetaPersonaYFicha(t *testing.T) {
	p := NombreCarpetaPersona("1120955821", "cristian deysdayr jimenez grajales")
	if p != "1120955821 cristian deysdayr jimenez grajales" {
		t.Fatalf("persona: %q", p)
	}
	f := NombreCarpetaFicha("2871234", "ANALISIS Y DESARROLLO")
	if f != "2871234 ANALISIS Y DESARROLLO" {
		t.Fatalf("ficha: %q", f)
	}
}

func TestSanitizarNombreCarpeta(t *testing.T) {
	got := SanitizarNombreCarpeta("a/b\\c:d")
	if got != "a b c d" {
		t.Fatalf("got %q", got)
	}
	if SanitizarNombreCarpeta("   ") != "sin-nombre" {
		t.Fatal("vacío debe ser sin-nombre")
	}
}

func TestRutaEntregaLMS(t *testing.T) {
	got := RutaEntregaLMS(12, 4, 9)
	want := "storage/lms/entregas/12/4/9"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if RutaEntregasActividadLMS(12, 4) != "storage/lms/entregas/12/4" {
		t.Fatal("carpeta de la actividad mal armada")
	}
}

func TestRutaCarpetaFichaSegunTipo(t *testing.T) {
	ruta := RutaCarpetaFicha("1120 persona", models.TipoFormacionComplementaria, "99 PROG")
	want := "storage/lms/1120 persona/Formacion Complementaria/99 PROG"
	if ruta != want {
		t.Fatalf("got %q want %q", ruta, want)
	}
}
