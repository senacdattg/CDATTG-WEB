/**
 * Compruebo que la salida masiva respeta a quienes se excluyen.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestIdsACerrarSalidaMasivaExcluye(t *testing.T) {
	t.Parallel()
	abiertas := []models.PersonaIngresoSalida{{}, {}, {}}
	abiertas[0].ID, abiertas[1].ID, abiertas[2].ID = 10, 11, 12
	got := idsACerrarSalidaMasiva(abiertas, []uint{11, 0})
	if len(got) != 2 || got[0] != 10 || got[1] != 12 {
		t.Fatalf("%v", got)
	}
}

func TestIdsACerrarSalidaMasivaSinExcluir(t *testing.T) {
	t.Parallel()
	abiertas := []models.PersonaIngresoSalida{{}}
	abiertas[0].ID = 3
	got := idsACerrarSalidaMasiva(abiertas, nil)
	if len(got) != 1 || got[0] != 3 {
		t.Fatalf("%v", got)
	}
}

func TestVisitaPorID(t *testing.T) {
	t.Parallel()
	rows := []models.PersonaIngresoSalida{{}}
	rows[0].ID = 8
	if visitaPorID(rows, 8) == nil || visitaPorID(rows, 9) != nil {
		t.Fatal("busqueda")
	}
}

func TestIdsACerrarSalidaMasivaTodasExcluidas(t *testing.T) {
	t.Parallel()
	abiertas := []models.PersonaIngresoSalida{{}}
	abiertas[0].ID = 4
	got := idsACerrarSalidaMasiva(abiertas, []uint{4})
	if len(got) != 0 {
		t.Fatalf("%v", got)
	}
}
