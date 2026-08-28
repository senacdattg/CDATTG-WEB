package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestFichasDeTipoFiltraYRespetaAlcance(t *testing.T) {
	todas := []models.LmsCarpetaFicha{
		{FichaID: 1, TipoFormacion: models.TipoFormacionRegular},
		{FichaID: 2, TipoFormacion: models.TipoFormacionMediaTecnica},
		{FichaID: 3, TipoFormacion: models.TipoFormacionRegular},
	}
	got := fichasDeTipo(todas, models.TipoFormacionRegular, nil)
	if len(got) != 2 {
		t.Fatal("staff ve las regulares")
	}
	got = fichasDeTipo(todas, models.TipoFormacionRegular, []uint{3})
	if len(got) != 1 || got[0].FichaID != 3 {
		t.Fatal("instructor solo la ficha suya")
	}
}

func TestMapEntregasAuditoriaIncluyeNotaYComentario(t *testing.T) {
	nota := 85.0
	ents := []models.LmsEntrega{{
		ActividadID: 4, Calificacion: &nota, ComentarioInstructor: "Bien",
		EntregadoEn: time.Now(),
	}}
	ents[0].ID = 9
	got := mapEntregasAuditoria(21, ents, map[uint]string{4: "Guía 1"})
	if len(got) != 1 {
		t.Fatal("debe listar la entrega")
	}
	if got[0].Calificacion == nil || *got[0].Calificacion != 85 || got[0].ComentarioInstructor != "Bien" {
		t.Fatalf("falta la nota o el comentario: %+v", got[0])
	}
}

func TestBusquedaAuditoriaVacia(t *testing.T) {
	got := busquedaAuditoriaVacia(0)
	if got == nil || got.Page != 1 || got.PageSize != 20 {
		t.Fatal("página 0 se corrige a 1 y tamaño 20")
	}
	if len(got.Fichas) != 0 || len(got.Personas) != 0 {
		t.Fatal("listas vacías, no nulas")
	}
}
