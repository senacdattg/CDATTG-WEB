/**
 * Compruebo la validación y el Excel de visitas de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"archive/zip"
	"bytes"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestValidarBorrarAcceso(t *testing.T) {
	t.Parallel()
	ok := dto.AccesoBorrarRequest{
		FechaDesde: "2026-01-01", FechaHasta: "2026-01-02",
		DescargaOk: true, Confirmacion1: "ELIMINAR", Confirmacion2: "ELIMINAR",
	}
	if err := validarBorrarAcceso(ok); err != nil {
		t.Fatal(err)
	}
	sinZip := ok
	sinZip.DescargaOk = false
	if validarBorrarAcceso(sinZip) == nil {
		t.Fatal("falta zip")
	}
	mal := ok
	mal.Confirmacion2 = "borrar"
	if validarBorrarAcceso(mal) == nil {
		t.Fatal("frase")
	}
	sinFecha := ok
	sinFecha.FechaDesde, sinFecha.FechaHasta = "", ""
	if validarBorrarAcceso(sinFecha) == nil {
		t.Fatal("fecha")
	}
}

func TestFilaExcelAccesoYZip(t *testing.T) {
	t.Parallel()
	p := &models.Persona{NumeroDocumento: "99", PrimerNombre: "Ana", PrimerApellido: "Pérez"}
	row := models.PersonaIngresoSalida{TipoPersona: "APRENDIZ", MetodoRegistro: "MANUAL"}
	row.ID = 7
	row.Persona = p
	row.TimestampEntrada = time.Date(2026, 1, 2, 8, 0, 0, 0, time.UTC)
	fila := filaExcelAcceso(row)
	if fila[0] != "7" || fila[1] != "99" || fila[2] != "Ana Pérez" || fila[10] != "abierto" {
		t.Fatalf("%v", fila)
	}
	xlsx, err := excelDeVisitasAcceso([]models.PersonaIngresoSalida{row})
	if err != nil || len(xlsx) == 0 {
		t.Fatal(err)
	}
	z, err := zipConExcel("registros-acceso.xlsx", xlsx)
	if err != nil {
		t.Fatal(err)
	}
	r, err := zip.NewReader(bytes.NewReader(z), int64(len(z)))
	if err != nil || len(r.File) != 1 || r.File[0].Name != "registros-acceso.xlsx" {
		t.Fatalf("zip %v %v", err, r)
	}
}
