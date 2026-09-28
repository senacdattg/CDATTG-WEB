/**
 * Armo el Excel de visitas de portería para el respaldo.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"strconv"
	"strings"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/xuri/excelize/v2"
)

var cabeceraExcelAcceso = []string{
	"visita_id", "documento", "nombre", "tipo", "sede",
	"entrada", "salida", "metodo", "motivo", "observacion",
	"estado", "salida_sin_ingreso",
}

const hojaExcelAcceso = "Accesos portería"

func nombrePersonaAcceso(p *models.Persona) string {
	if p == nil {
		return ""
	}
	partes := make([]string, 0, 4)
	for _, v := range []string{p.PrimerNombre, p.SegundoNombre, p.PrimerApellido, p.SegundoApellido} {
		v = strings.TrimSpace(v)
		if v != "" {
			partes = append(partes, v)
		}
	}
	return strings.Join(partes, " ")
}

func filaExcelAcceso(row models.PersonaIngresoSalida) []string {
	doc, nombre, sede := "", "", ""
	if row.Persona != nil {
		doc = row.Persona.NumeroDocumento
		nombre = nombrePersonaAcceso(row.Persona)
	}
	if row.Sede != nil {
		sede = row.Sede.Nombre
	}
	salida, estado := "", "abierto"
	if row.IngresoCancelado {
		estado = "cancelado"
	}
	if row.TimestampSalida != nil {
		salida = row.TimestampSalida.Format("2006-01-02 15:04:05")
		estado = "cerrado"
	}
	sinIng := "no"
	if row.SalidaSinIngreso {
		sinIng = "si"
	}
	return []string{
		strconv.FormatUint(uint64(row.ID), 10), doc, nombre, row.TipoPersona, sede,
		row.TimestampEntrada.Format("2006-01-02 15:04:05"), salida,
		row.MetodoRegistro, row.MotivoSalida, row.ObservacionSalida,
		estado, sinIng,
	}
}

func excelDeVisitasAcceso(rows []models.PersonaIngresoSalida) ([]byte, error) {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()
	nombre := f.GetSheetName(0)
	_ = f.SetSheetName(nombre, hojaExcelAcceso)
	for c, titulo := range cabeceraExcelAcceso {
		celda, _ := excelize.CoordinatesToCellName(c+1, 1)
		_ = f.SetCellValue(hojaExcelAcceso, celda, titulo)
	}
	for i := range rows {
		vals := filaExcelAcceso(rows[i])
		for c, v := range vals {
			celda, _ := excelize.CoordinatesToCellName(c+1, i+2)
			_ = f.SetCellValue(hojaExcelAcceso, celda, v)
		}
	}
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
