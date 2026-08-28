package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestAprendicesActivosAulaOmiteOcultosEInactivos(t *testing.T) {
	list := []models.Aprendiz{
		{Estado: true, OcultoEnAsistencia: false},
		{Estado: true, OcultoEnAsistencia: true},
		{Estado: false, OcultoEnAsistencia: false},
	}
	got := aprendicesActivosAula(list)
	if len(got) != 1 {
		t.Fatalf("esperaba 1 activo visible, hubo %d", len(got))
	}
}

func TestMarcarActividadesEntregadas(t *testing.T) {
	items := []dto.LmsActividadItem{{ID: 1}, {ID: 2}}
	marcarActividadesEntregadas(items, map[uint]bool{2: true})
	if items[0].Entregada || !items[1].Entregada {
		t.Fatal("solo la actividad 2 debía quedar entregada")
	}
}

func TestMarcarActividadesEntregadasMapaVacio(t *testing.T) {
	items := []dto.LmsActividadItem{{ID: 8}}
	marcarActividadesEntregadas(items, map[uint]bool{})
	if items[0].Entregada {
		t.Fatal("sin envío no debe marcar entregada")
	}
}
