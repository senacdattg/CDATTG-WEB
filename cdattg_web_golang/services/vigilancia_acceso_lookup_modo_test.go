/**
 * Pruebo el modo del lookup y el cierre de salida.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestAplicarModoLookupEntradaConPersonaDentro(t *testing.T) {
	s := &vigilanciaAccesoService{}
	out, err := s.aplicarModoLookup(modoEntrada, true, &models.Persona{}, nil, 1)
	if err != nil {
		t.Fatal(err)
	}
	if out.puede {
		t.Fatal("no debe confirmar ingreso si ya está adentro")
	}
	if out.accion != accionIngreso {
		t.Fatalf("accion=%s", out.accion)
	}
}

func TestAplicarModoLookupSalidaConPersonaDentro(t *testing.T) {
	s := &vigilanciaAccesoService{}
	out, err := s.aplicarModoLookup(modoSalida, true, &models.Persona{}, nil, 1)
	if err != nil {
		t.Fatal(err)
	}
	if out.accion != accionSalida {
		t.Fatalf("accion=%s", out.accion)
	}
	if out.permiteSinIngreso {
		t.Fatal("con visita abierta no es irregular")
	}
}
func TestAplicarModoLookupEntradaLibre(t *testing.T) {
	s := &vigilanciaAccesoService{}
	out, err := s.aplicarModoLookup(modoEntrada, false, &models.Persona{}, nil, 1)
	if err != nil {
		t.Fatal(err)
	}
	if out.puede == false || out.accion != accionIngreso {
		t.Fatalf("puede=%v accion=%s", out.puede, out.accion)
	}
}

func TestAnotarMetodoSalidaVacioNoCambia(t *testing.T) {
	v := &models.PersonaIngresoSalida{MetodoRegistro: metodoLaser, Observaciones: "ok"}
	anotarMetodoSalida(v, "")
	if v.Observaciones != "ok" {
		t.Fatalf("obs=%s", v.Observaciones)
	}
}

func TestAnotarMetodoSalidaIgualNoCambia(t *testing.T) {
	v := &models.PersonaIngresoSalida{MetodoRegistro: metodoLaser, Observaciones: "ok"}
	anotarMetodoSalida(v, metodoLaser)
	if v.Observaciones != "ok" {
		t.Fatalf("obs=%s", v.Observaciones)
	}
}

func TestAnotarMetodoSalidaDistintoConcatena(t *testing.T) {
	v := &models.PersonaIngresoSalida{MetodoRegistro: metodoLaser, Observaciones: "a"}
	anotarMetodoSalida(v, metodoManual)
	if v.Observaciones != "a; salida_metodo=MANUAL" {
		t.Fatalf("obs=%s", v.Observaciones)
	}
}

func TestAnotarMetodoSalidaPrimeraNota(t *testing.T) {
	v := &models.PersonaIngresoSalida{MetodoRegistro: metodoLaser}
	anotarMetodoSalida(v, metodoCamara)
	if v.Observaciones != "salida_metodo=CAMARA" {
		t.Fatalf("obs=%s", v.Observaciones)
	}
}

func TestErrFaltanSegundosSalida(t *testing.T) {
	err := errFaltanSegundosSalida(3, "el ingreso")
	if err == nil || err.Error() != "faltan 3 segundos desde el ingreso" {
		t.Fatalf("err=%v", err)
	}
}

func TestSegundosRestantesSalidaCeroSinVisita(t *testing.T) {
	if segundosRestantesSalida(nil, time.Now()) != 0 {
		t.Fatal("sin visita no espera")
	}
}
