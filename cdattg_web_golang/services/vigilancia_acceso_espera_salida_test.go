/**
 * Pruebo la espera minima de 10 s antes de registrar la salida automatica de porteria.
 *
 * Con visita abierta la espera se cuenta desde el ingreso. Sin visita abierta (salida
 * irregular) la referencia es la ultima salida irregular de la misma persona, para que un
 * carnet que permanece en el lector no genere registros duplicados.
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

// salidaIrregularDevuelve simula la ultima salida irregular registrada hace "hace".
func salidaIrregularDevuelve(hace time.Duration) *models.PersonaIngresoSalida {
	ts := time.Now().Add(-hace)
	return &models.PersonaIngresoSalida{
		SedeID:           7,
		TimestampEntrada: ts,
		TimestampSalida:  &ts,
		SalidaSinIngreso: true,
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
	// El helper de la visita abierta no aplica en la irregular: se mide aparte.
	if got := segundosRestantesSalida(nil, time.Now()); got != 0 {
		t.Fatalf("sin visita abierta no hay espera desde el ingreso, obtuvo %d", got)
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

func TestSegundosRestantesSalidaIrregular_dentroDeEspera(t *testing.T) {
	t.Parallel()
	// El carnet sigue en el lector: hay que impedir el segundo registro irregular.
	got := segundosRestantesSalidaIrregular(salidaIrregularDevuelve(3*time.Second), time.Now())
	if got <= 0 {
		t.Fatalf("a los 3 s deben faltar segundos, obtuvo %d", got)
	}
	if got > 7 {
		t.Fatalf("faltan como maximo 7 s, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalidaIrregular_yaCumplio(t *testing.T) {
	t.Parallel()
	// Transcurridos los 10 s el vigilante puede volver a escanear y ya se registra.
	if got := segundosRestantesSalidaIrregular(salidaIrregularDevuelve(10*time.Second), time.Now()); got != 0 {
		t.Fatalf("al cumplirse 10 s debe quedar habilitada, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalidaIrregular_muyVieja(t *testing.T) {
	t.Parallel()
	// Una salida irregular de hace 2 h no debe bloquear nada.
	if got := segundosRestantesSalidaIrregular(salidaIrregularDevuelve(2*time.Hour), time.Now()); got != 0 {
		t.Fatalf("una salida irregular antigua no debe esperar, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalidaIrregular_sinHistorialNoEspera(t *testing.T) {
	t.Parallel()
	// Primera salida irregular de la persona: no hay referencia, se registra de inmediato.
	if got := segundosRestantesSalidaIrregular(nil, time.Now()); got != 0 {
		t.Fatalf("la primera salida irregular no debe esperar, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalidaIrregular_sinTimestampSalida(t *testing.T) {
	t.Parallel()
	// Fila irregular sin timestamp de salida: no debe bloquear.
	if got := segundosRestantesSalidaIrregular(&models.PersonaIngresoSalida{}, time.Now()); got != 0 {
		t.Fatalf("una fila sin timestamp de salida no debe esperar, obtuvo %d", got)
	}
}

func TestSegundosRestantesSalidaIrregular_salidaEnFuturo(t *testing.T) {
	t.Parallel()
	// Reloj desfasado: una salida irregular "futura" no debe bloquear.
	futuro := time.Now().Add(5 * time.Second)
	row := &models.PersonaIngresoSalida{TimestampSalida: &futuro, SalidaSinIngreso: true}
	if got := segundosRestantesSalidaIrregular(row, time.Now()); got != 0 {
		t.Fatalf("una salida irregular futura no debe bloquear, obtuvo %d", got)
	}
}

func TestSegundosRestantesDesde_redondeaHaciaArriba(t *testing.T) {
	t.Parallel()
	// Con 9,4 s restantes debe mostrar 10 s: el vigilante no espera de más.
	ref := time.Now()
	got := segundosRestantesDesde(&ref, ref.Add(600*time.Millisecond))
	if got != 10 {
		t.Fatalf("espera con decimales debe redondear hacia arriba, obtuvo %d", got)
	}
}
