package services

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/xuri/excelize/v2"
)

// ImportProgress se envía durante la importación por streaming (estadísticas en tiempo real).
type ImportProgress struct {
	Total      int    `json:"total"`
	Current    int    `json:"current"`
	Processed  int    `json:"processed"`
	Duplicates int    `json:"duplicates"`
	Errors     int    `json:"errors"`
	Type       string `json:"type,omitempty"` // "progress" | "done"
}

// Códigos cortos de tipo de documento (como vienen en el Excel) -> nombre en BD
var tipoDocCodigoANombre = map[string]string{
	"CC":  "CÉDULA DE CIUDADANÍA",
	"CE":  "CÉDULA DE EXTRANJERÍA",
	"PPT": "PASAPORTE",
	"TI":  "TARJETA DE IDENTIDAD",
	"RC":  "REGISTRO CIVIL",
	"SI":  "SIN IDENTIFICACIÓN",
}

// Headers esperados en la primera fila del Excel (sin importar mayúsculas/espacios)
var importHeaders = map[string]string{
	"tipo_documento":      "tipo_documento",
	"tipo documento":      "tipo_documento",
	"numero_documento":    "numero_documento",
	"número de documento": "numero_documento",
	"numero documento":    "numero_documento",
	"primer_nombre":       "primer_nombre",
	"primer nombre":       "primer_nombre",
	"segundo_nombre":      "segundo_nombre",
	"segundo nombre":      "segundo_nombre",
	"primer_apellido":     "primer_apellido",
	"primer apellido":     "primer_apellido",
	"segundo_apellido":    "segundo_apellido",
	"segundo apellido":    "segundo_apellido",
	"correo":              "correo",
	"email":               "correo",
	"celular":             "celular",
}

var requiredImportColumns = []struct {
	key string
	msg string
}{
	{"numero_documento", "falta la columna 'numero_documento' (o 'número de documento')"},
	{"primer_nombre", "falta la columna 'primer_nombre' (o 'primer nombre')"},
	{"primer_apellido", "falta la columna 'primer_apellido' (o 'primer apellido')"},
}

type PersonaImportService interface {
	ImportFromExcel(fileBytes []byte, filename string, userID uint) (*ImportResult, error)
	ImportFromExcelWithProgress(fileBytes []byte, filename string, userID uint, onProgress func(ImportProgress)) (*ImportResult, error)
	ListImports(limit int) ([]ImportLogItem, error)
}

type personaImportService struct {
	personaService PersonaService
	logRepo        repositories.PersonaImportLogRepository
	catalogoRepo   repositories.CatalogoRepository
}

func NewPersonaImportService(personaService PersonaService) PersonaImportService {
	return &personaImportService{
		personaService: personaService,
		logRepo:        repositories.NewPersonaImportLogRepository(),
		catalogoRepo:   repositories.NewCatalogoRepository(),
	}
}

type ImportResult struct {
	ProcessedCount  int    `json:"processed_count"`
	DuplicatesCount int    `json:"duplicates_count"`
	ErrorCount      int    `json:"error_count"`
	Status          string `json:"status"`
}

type ImportLogItem struct {
	ID              uint      `json:"id"`
	Filename        string    `json:"filename"`
	ProcessedCount  int       `json:"processed_count"`
	DuplicatesCount int       `json:"duplicates_count"`
	ErrorCount      int       `json:"error_count"`
	Status          string    `json:"status"`
	UsuarioNombre   string    `json:"usuario_nombre"`
	CreatedAt       time.Time `json:"created_at"`
}

func (s *personaImportService) ListImports(limit int) ([]ImportLogItem, error) {
	logs, err := s.logRepo.FindAll(limit)
	if err != nil {
		return nil, err
	}
	items := make([]ImportLogItem, len(logs))
	for i, l := range logs {
		items[i] = ImportLogItem{
			ID:              l.ID,
			Filename:        l.Filename,
			ProcessedCount:  l.ProcessedCount,
			DuplicatesCount: l.DuplicatesCount,
			ErrorCount:      l.ErrorCount,
			Status:          l.Status,
			CreatedAt:       l.CreatedAt,
		}
		if l.User != nil {
			items[i].UsuarioNombre = l.User.Email
		}
	}
	return items, nil
}

func (s *personaImportService) ImportFromExcel(fileBytes []byte, filename string, userID uint) (*ImportResult, error) {
	return s.ImportFromExcelWithProgress(fileBytes, filename, userID, nil)
}

// ImportFromExcelWithProgress igual que ImportFromExcel pero invoca onProgress tras cada fila (para streaming).
func (s *personaImportService) ImportFromExcelWithProgress(fileBytes []byte, filename string, userID uint, onProgress func(ImportProgress)) (*ImportResult, error) {
	rows, colIndex, err := openPersonaImportWorkbook(fileBytes)
	if err != nil {
		return nil, err
	}
	tipoByName := s.loadTipoDocumentoLookup()

	total := len(rows) - 1
	emitProgress(onProgress, ImportProgress{Total: total, Type: "progress"})

	processed, duplicates, errors, createdPersonaIDs := s.importPersonaRows(rows, colIndex, tipoByName, total, onProgress)

	if len(createdPersonaIDs) > 0 {
		_ = s.personaService.EnsureUsersForPersonas(createdPersonaIDs)
	}

	_ = s.logRepo.Create(&models.PersonaImportLog{
		Filename:        filename,
		UserID:          userID,
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errors,
		Status:          "completado",
		CreatedAt:       time.Now(),
	})

	result := &ImportResult{
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errors,
		Status:          "completado",
	}
	emitProgress(onProgress, ImportProgress{
		Total: total, Current: total, Processed: processed, Duplicates: duplicates, Errors: errors, Type: "done",
	})
	return result, nil
}

func openPersonaImportWorkbook(fileBytes []byte) (rows [][]string, colIndex map[string]int, err error) {
	f, err := excelize.OpenReader(bytes.NewReader(fileBytes))
	if err != nil {
		return nil, nil, fmt.Errorf("archivo Excel inválido: %w", err)
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return nil, nil, fmt.Errorf("el archivo no contiene hojas")
	}

	rows, err = f.GetRows(sheetName)
	if err != nil || len(rows) < 2 {
		return nil, nil, fmt.Errorf("el archivo debe tener al menos encabezados y una fila de datos")
	}

	colIndex = buildImportColIndex(rows[0])
	if err = validateRequiredImportColumns(colIndex); err != nil {
		return nil, nil, err
	}
	return rows, colIndex, nil
}

func buildImportColIndex(headerRow []string) map[string]int {
	colIndex := make(map[string]int)
	for i, cell := range headerRow {
		key := strings.TrimSpace(strings.ToLower(cell))
		if canonical, ok := importHeaders[key]; ok {
			colIndex[canonical] = i
		}
	}
	return colIndex
}

func validateRequiredImportColumns(colIndex map[string]int) error {
	for _, req := range requiredImportColumns {
		if _, ok := colIndex[req.key]; !ok {
			return fmt.Errorf("%s", req.msg)
		}
	}
	return nil
}

func (s *personaImportService) loadTipoDocumentoLookup() map[string]uint {
	tiposDoc, _ := s.catalogoRepo.FindTiposDocumento()
	tipoByName := make(map[string]uint, len(tiposDoc)+len(tipoDocCodigoANombre))
	for _, t := range tiposDoc {
		nombreNorm := strings.TrimSpace(strings.ToLower(t.Nombre))
		tipoByName[nombreNorm] = t.ID
	}
	// Permitir códigos cortos (CC, CE, PPT, TI, RC, SI) en la columna tipo_documento del Excel
	for codigo, nombreCompleto := range tipoDocCodigoANombre {
		nombreNorm := strings.TrimSpace(strings.ToLower(nombreCompleto))
		if id, has := tipoByName[nombreNorm]; has {
			tipoByName[strings.ToLower(codigo)] = id
		}
	}
	return tipoByName
}

func emitProgress(onProgress func(ImportProgress), p ImportProgress) {
	if onProgress != nil {
		onProgress(p)
	}
}

func isDuplicatePersonaError(err error) bool {
	msg := err.Error()
	return strings.Contains(msg, "ya está registrado") || strings.Contains(msg, "ya registrado")
}

func (s *personaImportService) importPersonaRows(
	rows [][]string,
	colIndex map[string]int,
	tipoByName map[string]uint,
	total int,
	onProgress func(ImportProgress),
) (processed, duplicates, errors int, createdPersonaIDs []uint) {
	for i := 1; i < len(rows); i++ {
		req := s.rowToPersonaRequest(rows[i], colIndex, tipoByName)
		if req == nil {
			emitProgress(onProgress, ImportProgress{
				Total: total, Current: i, Processed: processed, Duplicates: duplicates, Errors: errors, Type: "progress",
			})
			continue
		}
		resp, err := s.personaService.CreateWithoutUser(*req)
		if err != nil {
			if isDuplicatePersonaError(err) {
				duplicates++
			} else {
				errors++
			}
		} else {
			processed++
			createdPersonaIDs = append(createdPersonaIDs, resp.ID)
		}
		emitProgress(onProgress, ImportProgress{
			Total: total, Current: i, Processed: processed, Duplicates: duplicates, Errors: errors, Type: "progress",
		})
	}
	return processed, duplicates, errors, createdPersonaIDs
}

func (s *personaImportService) rowToPersonaRequest(row []string, colIndex map[string]int, tipoByName map[string]uint) *dto.PersonaRequest {
	get := func(key string) string {
		if idx, ok := colIndex[key]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
		return ""
	}
	numeroDoc := get("numero_documento")
	primerNombre := get("primer_nombre")
	primerApellido := get("primer_apellido")
	if numeroDoc == "" || primerNombre == "" || primerApellido == "" {
		return nil
	}

	req := &dto.PersonaRequest{
		NumeroDocumento: numeroDoc,
		PrimerNombre:    primerNombre,
		SegundoNombre:   get("segundo_nombre"),
		PrimerApellido:  primerApellido,
		SegundoApellido: get("segundo_apellido"),
		Celular:         get("celular"),
		Email:           get("correo"),
		Status:          ptrBool(true),
	}
	tipoStr := get("tipo_documento")
	if tipoStr != "" {
		if id, ok := tipoByName[strings.ToLower(tipoStr)]; ok {
			req.TipoDocumento = &id
		}
	}
	return req
}

func ptrBool(b bool) *bool {
	return &b
}
