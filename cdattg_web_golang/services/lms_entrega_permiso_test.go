package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestLmsAprendizPuedeEntregar(t *testing.T) {
	if lmsAprendizPuedeEntregar(nil) {
		t.Fatal("sin matrícula no entrega")
	}
	if !lmsAprendizPuedeEntregar(&models.Aprendiz{Estado: true}) {
		t.Fatal("activo visible sí entrega")
	}
	if lmsAprendizPuedeEntregar(&models.Aprendiz{Estado: true, OcultoEnAsistencia: true}) {
		t.Fatal("oculto en asistencia no entrega")
	}
	if lmsAprendizPuedeEntregar(&models.Aprendiz{Estado: false}) {
		t.Fatal("inactivo no entrega")
	}
}

func TestExigirEntregaAprendizSoloConsulta(t *testing.T) {
	if err := exigirEntregaAprendiz(&models.Aprendiz{Estado: true, OcultoEnAsistencia: true}); err != ErrLmsSoloConsulta {
		t.Fatal("debe bloquear la entrega")
	}
	if err := exigirEntregaAprendiz(&models.Aprendiz{Estado: true}); err != nil {
		t.Fatal(err)
	}
}
