package services

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/authz"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/xuri/excelize/v2"
)

// Tipos de rol del módulo Personal soportados por la importación masiva.
const (
	TipoRolGuarda                 = "guarda"
	TipoRolPersonalAdministrativo = "personal_administrativo"
)

// PersonalRolImportService define la importación masiva de guardas/personal administrativo desde Excel.
// El formato de plantilla es el mismo de instructores (BASE DE DATOS CONTRATISTAS REGULAR.xlsx).
type PersonalRolImportService interface {
	ImportFromExcel(tipo string, fileBytes []byte, filename string, userID uint) (*ImportResult, error)
	ListImports(tipo string, limit int) ([]PersonalRolImportLogItem, error)
	GenerarPlantilla(tipo string) ([]byte, string, error)
}

type personalRolImportService struct {
	helper    *instructorImportService
	guardaRepo repositories.GuardaRepository
	guardaSvc  GuardaService
	paRepo     repositories.PersonalAdministrativoRepository
	paSvc      PersonalAdministrativoService
	logRepo    repositories.PersonalRolImportLogRepository
}

// PersonalRolImportLogItem es un ítem del historial de importaciones de guardas/personal administrativo.
type PersonalRolImportLogItem struct {
	ID              uint      `json:"id"`
	Tipo            string    `json:"tipo"`
	Filename        string    `json:"filename"`
	ProcessedCount  int       `json:"processed_count"`
	DuplicatesCount int       `json:"duplicates_count"`
	ErrorCount      int       `json:"error_count"`
	Status          string    `json:"status"`
	UsuarioNombre   string    `json:"usuario_nombre"`
	CreatedAt       time.Time `json:"created_at"`
}

// NewPersonalRolImportService crea el servicio de importación de guardas/personal administrativo.
func NewPersonalRolImportService() PersonalRolImportService {
	return &personalRolImportService{
		helper:    NewInstructorImportService().(*instructorImportService),
		guardaRepo: repositories.NewGuardaRepository(),
		guardaSvc:  NewGuardaService(),
		paRepo:     repositories.NewPersonalAdministrativoRepository(),
		paSvc:      NewPersonalAdministrativoService(),
		logRepo:    repositories.NewPersonalRolImportLogRepository(),
	}
}

func rolCasbinByTipo(tipo string) string {
	if tipo == TipoRolGuarda {
		return authz.RolGuarda
	}
	return authz.RolPersonalAdministrativo
}

// tryImportRolRow intenta crear/vincular guarda o personal administrativo para una fila del Excel.
func (s *personalRolImportService) tryImportRolRow(tipo string, row []string, colIndex map[string]int, tipoByKey, generoByKey map[string]uint) instructorImportRowResult {
	var r instructorImportRowResult
	req := s.helper.rowToPersonaRequest(row, colIndex, tipoByKey, generoByKey)
	if req == nil {
		r.err = true
		return r
	}
	numeroDoc := strings.TrimSpace(req.NumeroDocumento)
	if numeroDoc == "" {
		r.err = true
		return r
	}

	persona, findErr := s.helper.personaRepo.FindByNumeroDocumento(numeroDoc)
	var personaID uint
	if findErr != nil || persona == nil {
		resp, createErr := s.helper.personaService.CreateWithoutUser(*req)
		if createErr != nil {
			if isPersonaDuplicadaErr(createErr) {
				r.duplicate = true
			} else {
				r.err = true
			}
			return r
		}
		personaID = resp.ID
		r.newPersonaID = personaID
	} else {
		personaID = persona.ID
	}

	switch tipo {
	case TipoRolGuarda:
		existing, _ := s.guardaRepo.FindByPersonaID(personaID)
		if existing != nil {
			r.duplicate = true
			return r
		}
		_, createErr := s.guardaSvc.CreateFromPersona(dto.CreateGuardaRequest{PersonaID: personaID})
		if createErr != nil {
			r.err = true
			return r
		}
	default:
		existing, _ := s.paRepo.FindByPersonaID(personaID)
		if existing != nil {
			r.duplicate = true
			return r
		}
		_, createErr := s.paSvc.CreateFromPersona(dto.CreatePersonalAdministrativoRequest{PersonaID: personaID})
		if createErr != nil {
			r.err = true
			return r
		}
	}
	r.processed = true
	return r
}

// ImportFromExcel procesa un archivo Excel y crea/vincula personas y guardas/personal administrativo.
func (s *personalRolImportService) ImportFromExcel(tipo string, fileBytes []byte, filename string, userID uint) (*ImportResult, error) {
	f, err := excelize.OpenReader(bytes.NewReader(fileBytes))
	if err != nil {
		return nil, fmt.Errorf("archivo Excel inválido: %w", err)
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	if sheetName == "" {
		return nil, fmt.Errorf("el archivo no contiene hojas")
	}

	rows, err := f.GetRows(sheetName)
	if err != nil || len(rows) < 2 {
		return nil, fmt.Errorf("el archivo debe tener al menos encabezados y una fila de datos")
	}

	colIndex, err := s.helper.buildColumnIndex(rows[0])
	if err != nil {
		return nil, err
	}

	tipoByKey, err := s.helper.buildTipoDocumentoMap()
	if err != nil {
		return nil, err
	}
	generoByKey, err := s.helper.buildGeneroMap()
	if err != nil {
		return nil, err
	}

	var processed, duplicates, errorsCount int
	var createdPersonaIDs []uint

	for i := 1; i < len(rows); i++ {
		res := s.tryImportRolRow(tipo, rows[i], colIndex, tipoByKey, generoByKey)
		switch {
		case res.err:
			errorsCount++
		case res.duplicate:
			duplicates++
		case res.processed:
			processed++
		}
		if res.newPersonaID != 0 {
			createdPersonaIDs = append(createdPersonaIDs, res.newPersonaID)
		}
	}

	if len(createdPersonaIDs) > 0 {
		_ = s.helper.personaService.EnsureUsersForPersonas(createdPersonaIDs)
	}

	logEntry := &models.PersonalRolImportLog{
		Tipo:            tipo,
		Filename:        filename,
		UserID:          userID,
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errorsCount,
		Status:          "completado",
		CreatedAt:       time.Now(),
	}
	_ = s.logRepo.Create(logEntry)

	return &ImportResult{
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errorsCount,
		Status:          "completado",
	}, nil
}

func (s *personalRolImportService) ListImports(tipo string, limit int) ([]PersonalRolImportLogItem, error) {
	logs, err := s.logRepo.FindAll(tipo, limit)
	if err != nil {
		return nil, err
	}
	items := make([]PersonalRolImportLogItem, len(logs))
	for i, l := range logs {
		items[i] = PersonalRolImportLogItem{
			ID:              l.ID,
			Tipo:            l.Tipo,
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

// GenerarPlantilla devuelve una plantilla Excel para importar guardas/personal administrativo.
func (s *personalRolImportService) GenerarPlantilla(tipo string) ([]byte, string, error) {
	f := excelize.NewFile()
	sheet := "Sheet1"
	headers := []string{"NOMBRES Y APELLIDOS COMPLETO", "TIPO DOCUMENTO", "IDENTIFICACIÓN", "NUMERO TELEFONO", "CORREO PERSONAL", "FECHA DE NACIMIENTO", "GÉNERO"}
	for i, h := range headers {
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