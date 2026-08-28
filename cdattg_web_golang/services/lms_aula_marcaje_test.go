package services

import (
	"testing"

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
