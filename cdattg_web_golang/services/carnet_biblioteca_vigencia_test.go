/**
 * Compruebo que una ficha vencida no sale en biblioteca.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func TestSolicitudesDeFichasVivasOcultaVencida(t *testing.T) {
	t.Parallel()
	hoy := time.Date(2026, 9, 27, 12, 0, 0, 0, time.UTC)
	ayer := hoy.AddDate(0, 0, -1)
	viva := models.FichaCaracterizacion{}
	viva.ID = 8
	fin := ayer
	muerta := models.FichaCaracterizacion{FechaFin: &fin}
	muerta.ID = 9
	list := []models.CarnetSolicitud{{FichaID: 8}, {FichaID: 9}}
	fichas := map[uint]models.FichaCaracterizacion{8: viva, 9: muerta}
	got := solicitudesDeFichasVivas(list, fichas, hoy)
	if len(got) != 1 || got[0].FichaID != 8 {
		t.Fatalf("%+v", got)
	}
}

func TestSolicitudesDeFichasVivasSinFicha(t *testing.T) {
	t.Parallel()
	list := []models.CarnetSolicitud{{FichaID: 3}}
	got := solicitudesDeFichasVivas(list, map[uint]models.FichaCaracterizacion{}, time.Now())
	if len(got) != 0 {
		t.Fatal("sin ficha no debe salir")
	}
}
