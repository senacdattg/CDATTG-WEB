package services

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/xuri/excelize/v2"
)

// complementarios_excel.go
// Plantilla de carga y parseo del Excel de documentos para verificación masiva.

const loteSheet = "Aspirantes"

// GenerarPlantillaLote crea el Excel de ejemplo que el operador llena con los documentos.
func GenerarPlantillaLote() ([]byte, error) {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()

	idx, err := f.NewSheet(loteSheet)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(idx)
	_ = f.DeleteSheet("Sheet1")

	// Encabezados.
	_ = f.SetCellValue(loteSheet, "A1", "numero_documento")
	_ = f.SetCellValue(loteSheet, "A2", "1012345678")

	style, err := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	if err == nil {
		_ = f.SetCellStyle(loteSheet, "A1", "A1", style)
	}
	_ = f.SetColWidth(loteSheet, "A", "A", 22)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ParsearLoteExcel lee los documentos del Excel subido.
// Acepta la columna numero_documento (obligatoria) y tipo_documento (opcional).
func ParsearLoteExcel(contenido []byte) ([]dto.LoteDocumento, error) {
	f, err := excelize.OpenReader(bytes.NewReader(contenido))
	if err != nil {
		return nil, fmt.Errorf("no se pudo leer el Excel: %w", err)
	}
	defer func() { _ = f.Close() }()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("el Excel no tiene hojas")
	}
	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, fmt.Errorf("no se pudieron leer las filas: %w", err)
	}

	var docs []dto.LoteDocumento
	vistos := make(map[string]bool)
	for i, row := range rows {
		if i == 0 {
			// Saltar encabezado si la primera celda no es numérica.
			if len(row) > 0 && !esNumerico(strings.TrimSpace(row[0])) {
				continue
			}
		}
		if len(row) == 0 {
			continue
		}
		numero := strings.TrimSpace(row[0])
		if numero == "" || !esNumerico(numero) {
			continue
		}
		if vistos[numero] {
			continue // evitar duplicados en el mismo archivo
		}
		vistos[numero] = true

		tipo := ""
		if len(row) > 1 {
			tipo = strings.TrimSpace(row[1])
		}
		docs = append(docs, dto.LoteDocumento{NumeroDocumento: numero, TipoDocumento: tipo})
	}
	return docs, nil
}

func esNumerico(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}
