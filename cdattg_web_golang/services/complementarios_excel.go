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

const (
	loteSheet              = "Aspirantes"
	loteInscripcionesSheet = "Inscripciones"
	errExcelLeer           = "no se pudo leer el Excel: %w"
	errExcelSinHojas       = "el Excel no tiene hojas"
	errExcelFilas          = "no se pudieron leer las filas: %w"
)

func abrirPrimeraHoja(contenido []byte) (*excelize.File, [][]string, error) {
	f, err := excelize.OpenReader(bytes.NewReader(contenido))
	if err != nil {
		return nil, nil, fmt.Errorf(errExcelLeer, err)
	}
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		_ = f.Close()
		return nil, nil, fmt.Errorf(errExcelSinHojas)
	}
	rows, err := f.GetRows(sheets[0])
	if err != nil {
		_ = f.Close()
		return nil, nil, fmt.Errorf(errExcelFilas, err)
	}
	return f, rows, nil
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

func esFilaEncabezadoDocumento(primera string) bool {
	h := strings.ToLower(strings.TrimSpace(primera))
	return strings.Contains(h, "numero") || strings.Contains(h, "documento") || !esNumerico(h)
}

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
func ParsearLoteExcel(contenido []byte) ([]dto.LoteDocumento, error) {
	f, rows, err := abrirPrimeraHoja(contenido)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	var docs []dto.LoteDocumento
	vistos := make(map[string]bool)
	for i, row := range rows {
		if i == 0 && len(row) > 0 && !esNumerico(strings.TrimSpace(row[0])) {
			continue
		}
		if len(row) == 0 {
			continue
		}
		numero := strings.TrimSpace(row[0])
		if numero == "" || !esNumerico(numero) || vistos[numero] {
			continue
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

// GenerarPlantillaInscripciones Excel: numero_documento, ficha, tipo_documento (opcional).
func GenerarPlantillaInscripciones() ([]byte, error) {
	f := excelize.NewFile()
	defer func() { _ = f.Close() }()

	idx, err := f.NewSheet(loteInscripcionesSheet)
	if err != nil {
		return nil, err
	}
	f.SetActiveSheet(idx)
	_ = f.DeleteSheet("Sheet1")

	_ = f.SetCellValue(loteInscripcionesSheet, "A1", "numero_documento")
	_ = f.SetCellValue(loteInscripcionesSheet, "B1", "ficha")
	_ = f.SetCellValue(loteInscripcionesSheet, "C1", "tipo_documento")
	_ = f.SetCellValue(loteInscripcionesSheet, "A2", "1120955821")
	_ = f.SetCellValue(loteInscripcionesSheet, "B2", "1436114")
	_ = f.SetCellValue(loteInscripcionesSheet, "C2", "CC")

	style, err := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	if err == nil {
		_ = f.SetCellStyle(loteInscripcionesSheet, "A1", "C1", style)
	}
	_ = f.SetColWidth(loteInscripcionesSheet, "A", "C", 22)

	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ParsearLoteInscripcionesExcel lee numero_documento + ficha (+ tipo opcional).
func ParsearLoteInscripcionesExcel(contenido []byte) ([]dto.LoteInscripcionFila, error) {
	f, rows, err := abrirPrimeraHoja(contenido)
	if err != nil {
		return nil, err
	}
	defer func() { _ = f.Close() }()

	var filas []dto.LoteInscripcionFila
	vistos := make(map[string]bool)
	for i, row := range rows {
		if i == 0 && len(row) > 0 && esFilaEncabezadoDocumento(row[0]) {
			continue
		}
		if len(row) < 2 {
			continue
		}
		numero := strings.TrimSpace(row[0])
		ficha := strings.TrimSpace(row[1])
		if numero == "" || ficha == "" || !esNumerico(numero) || !esNumerico(ficha) {
			continue
		}
		clave := numero + "|" + ficha
		if vistos[clave] {
			continue
		}
		vistos[clave] = true
		tipo := ""
		if len(row) > 2 {
			tipo = strings.TrimSpace(row[2])
		}
		filas = append(filas, dto.LoteInscripcionFila{
			NumeroDocumento: numero,
			Ficha:           ficha,
			TipoDocumento:   tipo,
		})
	}
	return filas, nil
}
