package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestArmarFilasHistorialCruzaAprendizYActividad(t *testing.T) {
	max := 50.0
	nota := 40.0
	aps := []models.Aprendiz{{UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 2}}}}
	aps[0].Persona = &models.Persona{PrimerNombre: "ANA", PrimerApellido: "LOPEZ"}
	acts := []models.LmsActividad{
		{UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 4}}, Titulo: "Guía 1", CalificacionMax: &max},
	}
	ents := []models.LmsEntrega{{AprendizID: 2, ActividadID: 4, Calificacion: &nota}}
	got := armarFilasHistorial(aps, acts, ents)
	if len(got) != 1 {
		t.Fatalf("esperaba 1 fila, hubo %d", len(got))
	}
	if got[0].AprendizNombre == "" || got[0].Titulo != "Guía 1" {
		t.Fatal("faltó nombre o título")
	}
	if got[0].Calificacion == nil || *got[0].Calificacion != 40 || got[0].CalificacionMax != 50 {
		t.Fatal("la nota no coincide")
	}
}

func TestArmarFilasHistorialSinNota(t *testing.T) {
	aps := []models.Aprendiz{{UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 3}}}}
	acts := []models.LmsActividad{{UserAuditModel: models.UserAuditModel{BaseModel: models.BaseModel{ID: 8}}, Titulo: "Tarea"}}
	got := armarFilasHistorial(aps, acts, nil)
	if len(got) != 1 || got[0].Calificacion != nil || got[0].CalificacionMax != 100 {
		t.Fatal("sin entrega debe salir sin nota y tope 100")
	}
}

func TestArmarFilasHistorialVacio(t *testing.T) {
	if len(armarFilasHistorial(nil, nil, nil)) != 0 {
		t.Fatal("sin aprendices ni actividades no hay filas")
	}
}
