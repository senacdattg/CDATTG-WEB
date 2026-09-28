/**
 * Compruebo que el super vigilante solo gana ver y crear, no borrar.
 *
 * @author Cristian Deysdayr Jiménez
 */
package authz

import "testing"

func TestVerYCrearDePersonal(t *testing.T) {
	got := VerYCrearDe(PermisosPersonalOperativoYDeApoyo)
	if len(got) != 2 {
		t.Fatalf("len=%d", len(got))
	}
	if got[0] != "VER PERSONAL OPERATIVO Y DE APOYO" || got[1] != "CREAR PERSONAL OPERATIVO Y DE APOYO" {
		t.Fatalf("%v", got)
	}
	for _, p := range got {
		if p == "ELIMINAR PERSONAL OPERATIVO Y DE APOYO" {
			t.Fatal("no debe incluir eliminar")
		}
	}
}

func TestVerYCrearDeCorto(t *testing.T) {
	got := VerYCrearDe([]string{"SOLO"})
	if len(got) != 1 || got[0] != "SOLO" {
		t.Fatalf("%v", got)
	}
}

func TestAltaPersonaSupervigilante(t *testing.T) {
	if !IsValidPermiso(ObjPersona, PermisosAltaPersonaSupervigilante[0]) {
		t.Fatal("CREAR PERSONA debe existir")
	}
	for _, p := range PermisosVigilancia {
		if p == "CREAR PERSONA" {
			t.Fatal("el paquete del vigilante no debe llevar CREAR PERSONA")
		}
	}
}
