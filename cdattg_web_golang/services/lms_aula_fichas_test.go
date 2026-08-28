package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestUnirFichasAulaIncluyeAprendiz(t *testing.T) {
	inst := []models.FichaCaracterizacion{{Ficha: "82"}}
	inst[0].ID = 82
	apr := []models.FichaCaracterizacion{{Ficha: "3173334"}}
	apr[0].ID = 21
	got := unirFichasAula(inst, apr)
	if len(got) != 2 {
		t.Fatalf("esperaba 2 aulas, hubo %d", len(got))
	}
}

func TestUnirFichasAulaNoRepite(t *testing.T) {
	a := []models.FichaCaracterizacion{{Ficha: "3173334"}}
	a[0].ID = 21
	got := unirFichasAula(a, a)
	if len(got) != 1 {
		t.Fatal("la misma ficha no debe duplicarse")
	}
}

func TestUnirFichasAulaSoloAprendiz(t *testing.T) {
	apr := []models.FichaCaracterizacion{{Ficha: "3173334"}}
	apr[0].ID = 21
	got := unirFichasAula(nil, apr)
	if len(got) != 1 || got[0].Ficha != "3173334" {
		t.Fatal("debe listar la ficha de aprendiz")
	}
}
