/**
 * Compruebo la marca de listo y que no se marca si la ficha ya cerró.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestAplicarMarcaListoPoneYQuita(t *testing.T) {
	t.Parallel()
	sol := &models.CarnetSolicitud{}
	ahora := time.Date(2026, 9, 27, 8, 0, 0, 0, time.UTC)
	aplicarMarcaListo(sol, true, ahora)
	if !sol.Listo || sol.ListoEn == nil || !sol.ListoEn.Equal(ahora) {
		t.Fatalf("listo %+v", sol)
	}
	aplicarMarcaListo(sol, false, ahora)
	if sol.Listo || sol.ListoEn != nil {
		t.Fatal("debía quitar la marca")
	}
}

func TestFichaVivaDeSolicitud(t *testing.T) {
	t.Parallel()
	hoy := time.Date(2026, 9, 27, 12, 0, 0, 0, time.UTC)
	f := models.FichaCaracterizacion{}
	f.ID = 1
	if !fichaVivaDeSolicitud(map[uint]models.FichaCaracterizacion{1: f}, 1, hoy) {
		t.Fatal("sin fechas sigue viva")
	}
	if fichaVivaDeSolicitud(map[uint]models.FichaCaracterizacion{}, 1, hoy) {
		t.Fatal("faltante no es viva")
	}
}
