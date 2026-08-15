// @module personal_rol_import_template
// @description Generación de plantilla Excel para importar Guardas/Personal Administrativo.
// @author JDTWOR
// @created 2026-08-14
package services

import (
	"bytes"
	"fmt"

	"github.com/xuri/excelize/v2"
)

// plantillaRolHeaders son las columnas del formato oficial para importar guardas/personal administrativo.
var plantillaRolHeaders = []string{
	"NOMBRES Y APELLIDOS COMPLETO",
	"TIPO DOCUMENTO",
	"IDENTIFICACIÓN",
	"NUMERO TELEFONO",
	"CORREO PERSONAL",
	"FECHA DE NACIMIENTO",
	"GÉNERO",
}

// GenerarPlantilla devuelve una plantilla Excel con encabezados y una fila de ejemplo.
// Parámetros: tipo (guarda | personal_administrativo), determina el nombre del archivo resultante.
// Retorna el contenido XLSX y el nombre sugerido. Ejemplo: GenerarPlantilla("guarda") ->
// plantilla_importar_guardas.xlsx.
func (s *personalRolImportService) GenerarPlantilla(tipo string) ([]byte, string, error) {
	f := excelize.NewFile()
	sheet := "Sheet1"
	for i, h := range plantillaRolHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	_ = f.SetCellValue(sheet, "A2", "Ejemplo Uno")
	_ = f.SetCellValue(sheet, "B2", "Cédula de Ciudadanía")
	_ = f.SetCellValue(sheet, "C2", "12345678")
	_ = f.SetCellValue(sheet, "D2", "3001234567")
	_ = f.SetCellValue(sheet, "E2", "ejemplo@correo.com")
	_ = f.SetCellValue(sheet, "F2", "01/01/1990")
	_ = f.SetCellValue(sheet, "G2", "M")

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, "", fmt.Errorf("error generando plantilla")
	}
	if tipo == TipoRolGuarda {
		return buf.Bytes(), "plantilla_importar_guardas.xlsx", nil
	}
	return buf.Bytes(), "plantilla_importar_personal_administrativo.xlsx", nil
}