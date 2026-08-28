package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestIdsDeActividades(t *testing.T) {
	list := []models.LmsActividad{{}, {}}
	list[0].ID = 4
	list[1].ID = 9
	got := idsDeActividades(list)
	if len(got) != 2 || got[0] != 4 || got[1] != 9 {
		t.Fatalf("ids inesperados: %v", got)
	}
}

func TestMarcarCantidadEntregas(t *testing.T) {
	items := []dto.LmsActividadItem{{ID: 1}, {ID: 2}}
	marcarCantidadEntregas(items, map[uint]int{2: 3})
	if items[0].CantidadEntregas != 0 || items[1].CantidadEntregas != 3 {
		t.Fatal("solo la actividad 2 debía tener 3 envíos")
	}
}
