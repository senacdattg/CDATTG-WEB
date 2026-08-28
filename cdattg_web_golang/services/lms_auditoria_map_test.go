package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestMapAuditoriaFila(t *testing.T) {
	ap := models.Aprendiz{
		PersonaID:              4,
		FichaCaracterizacionID: 9,
		Estado:                 true,
		Persona:                &models.Persona{NumeroDocumento: "1120", PrimerNombre: "ANA", PrimerApellido: "LOPEZ"},
		FichaCaracterizacion: &models.FichaCaracterizacion{
			Ficha: "3424052",
			Nombre: "ADSO",
			Sede:   &models.Sede{Regional: &models.Regional{Nombre: "GUAVIARE"}},
		},
	}
	ap.FichaCaracterizacion.ID = 9
	got := mapAuditoriaFila(ap)
	if got.Documento != "1120" || got.NumeroFicha != "3424052" || got.Regional != "GUAVIARE" {
		t.Fatalf("fila mal armada: %+v", got)
	}
	if got.NombreCarpeta == "" || !got.Estado {
		t.Fatal("carpeta y estado activo")
	}
}

func TestMapPersonaAItem(t *testing.T) {
	p := models.Persona{NumeroDocumento: "99", PrimerNombre: "ANA", PrimerApellido: "LOPEZ"}
	p.ID = 7
	got := mapPersonaAItem(p)
	if got.PersonaID != 7 || got.Documento != "99" || got.NombreCarpeta == "" {
		t.Fatalf("carpeta raíz mal armada: %+v", got)
	}
}

func TestRegionalDeFichaVacia(t *testing.T) {
	if regionalDeFicha(nil) != "" {
		t.Fatal("sin ficha no hay regional")
	}
}
