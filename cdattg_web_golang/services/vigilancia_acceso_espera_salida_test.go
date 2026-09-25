/**
 * Pruebo la espera minima entre la entrada y la salida automatica de porteria.
 *
 * La salida solo se habilita al cumplirse esperaMinimaSalida (10 s) desde el ingreso.
 * Sin visita abierta (salida irregular) no hay espera: se registra de inmediato.
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func visitaEntrando(hace time.Duration) *models.PersonaIngresoSalida {
	return &models.PersonaIngresoSalida{
		SedeID:           7,
		TimestampEntrada: time.Now().Add(-hace),
	}
}

func TestSegundosRestantesSalida_dentroDeEspera(t *testing.T) {
	t.Parallel()
	got := segundosRestantesSalida(visitaEntrando(3*time.Second), time.Now())
	if got <= 0 {
		t.Fatalf("a los 3 s deben faltar segundos, obtuvo %d", got)
	}
	if got > 7 {
		t.Fatalf("faltan como maximo 7 s, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalida_yaCumplio(t *testing.T) {
	t.Parallel()
	if got := segundosRestantesSalida(visitaEntrando(10*time.Second), time.Now()); got != 0 {
		t.Fatalf("al cumplirse 10 s la salida debe quedar habilitada, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalida_muyVieja(t *testing.T) {
	t.Parallel()
	if got := segundosRestantesSalida(visitaEntrando(2*time.Hour), time.Now()); got != 0 {
		t.Fatalf("una visita de hace 2 h no debe esperar, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalida_sinIngresoNoEspera(t *testing.T) {
	t.Parallel()
	// Salida irregular: no hay visita abierta, luego no hay espera que aplicar.
	if got := segundosRestantesSalida(nil, time.Now()); got != 0 {
		t.Fatalf("la salida irregular no debe esperar, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalida_entradaEnFuturo(t *testing.T) {
	t.Parallel()
	// Reloj desfasado: la entrada "futura" no debe bloquear la salida.
	got := segundosRestantesSalida(visitaEntrando(-5*time.Second), time.Now())
	if got != 0 {
		t.Fatalf("una entrada futura no debe bloquear la salida, obtuvo %d", got)
	}
}
