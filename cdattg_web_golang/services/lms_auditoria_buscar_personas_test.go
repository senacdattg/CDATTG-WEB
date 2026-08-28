package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestFilasDeAprendicesVacio(t *testing.T) {
	if len(filasDeAprendices(nil)) != 0 {
		t.Fatal("sin aprendices la tabla queda vacía")
	}
}

func TestFichasModeloEnAlcance(t *testing.T) {
	list := []models.FichaCaracterizacion{{Ficha: "A"}, {Ficha: "B"}}
	list[0].ID = 1
	list[1].ID = 2
	got := fichasModeloEnAlcance(list, []uint{2})
	if len(got) != 1 || got[0].ID != 2 {
		t.Fatal("instructor solo su ficha")
	}
	if len(fichasModeloEnAlcance(list, nil)) != 2 {
		t.Fatal("staff ve las dos")
	}
}
