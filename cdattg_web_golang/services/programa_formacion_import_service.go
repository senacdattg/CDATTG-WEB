package services

import (
	"bytes"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/xuri/excelize/v2"
)

// Nombres de columnas del Excel catálogo (hoja "Programas en Ejecución")
const (
	colCodigo    = 0  // PRF_CODIGO
	colVersion   = 1  // PRF_VERSION
	colTipoForm  = 3  // TIPO DE FORMACION
	colNombre    = 4  // PRF_DENOMINACION
	colNivel     = 5  // NIVEL DE FORMACION
	colHorasTot  = 6  // PRF_DURACION_MAXIMA
	colHorasLect = 7  // PRF_DUR_ETAPA_LECTIVA
	colHorasProd = 8  // PRF_DUR_ETAPA_PROD
	colRedConoc  = 21 // Red de Conocimiento
)

var nivelesFormacionImportables = map[string]struct{}{
	"TECNICO":   {},
	"TECNOLOGO": {},
	"OPERARIO":  {},
	"AUXILIAR":  {},
}

type ProgramaFormacionImportService interface {
	ImportFromCatalogoExcel(fileBytes []byte, filename string) (*ProgramaImportResult, error)
}

type programaFormacionImportService struct {
	programaRepo repositories.ProgramaFormacionRepository
	redRepo      repositories.RedConocimientoRepository
	catalogoRepo repositories.CatalogoRepository
}

func NewProgramaFormacionImportService() ProgramaFormacionImportService {
	return &programaFormacionImportService{
		programaRepo: repositories.NewProgramaFormacionRepository(),
		redRepo:      repositories.NewRedConocimientoRepository(),
		catalogoRepo: repositories.NewCatalogoRepository(),
	}
}

type ProgramaImportResult struct {
	ProcessedCount  int    `json:"processed_count"`
	DuplicatesCount int    `json:"duplicates_count"`
	ErrorCount      int    `json:"error_count"`
	RedesCreated    int    `json:"redes_created"`
	Status          string `json:"status"`
}

type catalogoFilaVersion struct {
	version int
	row     []string
}

type importCatalogMaps struct {
	nivelByName    map[string]uint
	tipoTituladaID *uint
	redByName      map[string]uint
}

func (s *programaFormacionImportService) ImportFromCatalogoExcel(fileBytes []byte, _ string) (*ProgramaImportResult, error) {
	rows, err := openCatalogoExcelRows(fileBytes)
	if err != nil {
		return nil, err
	}

	byCodigo := agruparProgramasPorCodigoMaxVersion(filtrarFilasNivelImportable(rows))
	maps := s.loadImportCatalogMaps()
	processed, duplicates, errCount, redesCreated := s.importProgramasFromCodigoMap(byCodigo, maps)

	return &ProgramaImportResult{
		ProcessedCount:  processed,
		DuplicatesCount: duplicates,
		ErrorCount:      errCount,
		RedesCreated:    redesCreated,
		Status:          "completado",
	}, nil
}

func openCatalogoExcelRows(fileBytes []byte) ([][]string, error) {
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
	return rows, nil
}

func filtrarFilasNivelImportable(rows [][]string) [][]string {
	candidatos := make([][]string, 0, len(rows)/2)
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		if colNivel >= len(row) {
			continue
		}
		nivel := strings.TrimSpace(strings.ToUpper(normalizeAccents(row[colNivel])))
		if _, ok := nivelesFormacionImportables[nivel]; !ok {
			continue
		}
		candidatos = append(candidatos, row)
	}
	return candidatos
}

func agruparProgramasPorCodigoMaxVersion(candidatos [][]string) map[string]catalogoFilaVersion {
	byCodigo := make(map[string]catalogoFilaVersion)
	for _, row := range candidatos {
		if colCodigo >= len(row) || colVersion >= len(row) {
			continue
		}
		codigo := strings.TrimSpace(strings.ToUpper(row[colCodigo]))
		if codigo == "" {
			continue
		}
		ver, _ := strconv.Atoi(strings.TrimSpace(row[colVersion]))
		cur, ok := byCodigo[codigo]
		if !ok || ver > cur.version {
			byCodigo[codigo] = catalogoFilaVersion{version: ver, row: row}
		}
	}
	return byCodigo
}

func (s *programaFormacionImportService) loadImportCatalogMaps() importCatalogMaps {
	niveles, _ := s.catalogoRepo.FindNivelesFormacion()
	nivelByName := make(map[string]uint, len(niveles))
	for _, n := range niveles {
		key := strings.TrimSpace(strings.ToUpper(normalizeAccents(n.Nombre)))
		nivelByName[key] = n.ID
	}

	tipos, _ := s.catalogoRepo.FindTiposPrograma()
	var tipoTituladaID *uint
	for _, t := range tipos {
		if strings.TrimSpace(strings.ToUpper(normalizeAccents(t.Nombre))) != "TITULADA" {
			continue
		}
		id := t.ID
		tipoTituladaID = &id
		break
	}

	redesList, _ := s.redRepo.FindAll()
	redByName := make(map[string]uint, len(redesList))
	for _, r := range redesList {
		key := strings.TrimSpace(strings.ToUpper(normalizeAccents(r.Nombre)))
		redByName[key] = r.ID
	}

	return importCatalogMaps{
		nivelByName:    nivelByName,
		tipoTituladaID: tipoTituladaID,
		redByName:      redByName,
	}
}

func sortedCodigos(byCodigo map[string]catalogoFilaVersion) []string {
	codigos := make([]string, 0, len(byCodigo))
	for c := range byCodigo {
		codigos = append(codigos, c)
	}
	sort.Strings(codigos)
	return codigos
}

func (s *programaFormacionImportService) importProgramasFromCodigoMap(
	byCodigo map[string]catalogoFilaVersion,
	maps importCatalogMaps,
) (processed, duplicates, errCount, redesCreated int) {
	for _, codigo := range sortedCodigos(byCodigo) {
		req, errReq := s.rowToProgramaRequest(
			byCodigo[codigo].row,
			maps.nivelByName,
			maps.tipoTituladaID,
			maps.redByName,
			&redesCreated,
			s.redRepo,
		)
		if errReq != nil {
			errCount++
			continue
		}
		if req == nil {
			continue
		}
		req.Codigo = codigo
		if s.programaRepo.ExistsByCodigo(codigo) {
			duplicates++
			continue
		}
		p := s.toModel(*req)
		p.Codigo = codigo
		if err := s.programaRepo.Create(&p); err != nil {
			errCount++
			continue
		}
		processed++
	}
	return processed, duplicates, errCount, redesCreated
}

func (s *programaFormacionImportService) rowToProgramaRequest(
	row []string,
	nivelByName map[string]uint,
	tipoTituladaID *uint,
	redByName map[string]uint,
	redesCreated *int,
	redRepo repositories.RedConocimientoRepository,
) (*dto.ProgramaFormacionRequest, error) {
	get := func(i int) string {
		if i < len(row) {
			return strings.TrimSpace(row[i])
		}
		return ""
	}
	codigo := get(colCodigo)
	nombre := get(colNombre)
	if codigo == "" || nombre == "" {
		return nil, nil
	}
	req := &dto.ProgramaFormacionRequest{
		Codigo: codigo,
		Nombre: nombre,
		Status: ptrBool(true),
	}
	// Nivel de formación (TÉCNICO / TECNÓLOGO)
	nivelStr := strings.ToUpper(normalizeAccents(get(colNivel)))
	if id, ok := nivelByName[nivelStr]; ok {
		req.NivelFormacionID = &id
	}
	req.TipoProgramaID = tipoTituladaID
	// Horas
	if h := parseInt(get(colHorasTot)); h != nil {
		req.HorasTotales = h
	}
	if h := parseInt(get(colHorasLect)); h != nil {
		req.HorasEtapaLectiva = h
	}
	if h := parseInt(get(colHorasProd)); h != nil {
		req.HorasEtapaProductiva = h
	}
	if err := assignOrCreateRedConocimiento(req, get(colRedConoc), redByName, redesCreated, redRepo); err != nil {
		return nil, err
	}
	return req, nil
}

func assignOrCreateRedConocimiento(
	req *dto.ProgramaFormacionRequest,
	redNombre string,
	redByName map[string]uint,
	redesCreated *int,
	redRepo repositories.RedConocimientoRepository,
) error {
	if redNombre == "" {
		return nil
	}
	key := strings.ToUpper(normalizeAccents(redNombre))
	if id, ok := redByName[key]; ok {
		req.RedConocimientoID = &id
		return nil
	}
	red := &models.RedConocimiento{Nombre: strings.TrimSpace(redNombre)}
	if err := redRepo.Create(red); err != nil {
		return err
	}
	redByName[key] = red.ID
	*redesCreated++
	req.RedConocimientoID = &red.ID
	return nil
}

func (s *programaFormacionImportService) toModel(req dto.ProgramaFormacionRequest) models.ProgramaFormacion {
	p := models.ProgramaFormacion{
		Codigo:               req.Codigo,
		Nombre:               strings.TrimSpace(strings.ToUpper(req.Nombre)),
		RedConocimientoID:    req.RedConocimientoID,
		NivelFormacionID:     req.NivelFormacionID,
		TipoProgramaID:       req.TipoProgramaID,
		HorasTotales:         req.HorasTotales,
		HorasEtapaLectiva:    req.HorasEtapaLectiva,
		HorasEtapaProductiva: req.HorasEtapaProductiva,
		Status:               true,
	}
	if req.Status != nil {
		p.Status = *req.Status
	}
	return p
}

func normalizeAccents(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case 'Á', 'À', 'Â', 'Ã':
			b.WriteRune('A')
		case 'É', 'È', 'Ê':
			b.WriteRune('E')
		case 'Í', 'Ì', 'Î':
			b.WriteRune('I')
		case 'Ó', 'Ò', 'Ô', 'Õ':
			b.WriteRune('O')
		case 'Ú', 'Ù', 'Û':
			b.WriteRune('U')
		case 'Ñ':
			b.WriteRune('N')
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}

func parseInt(s string) *int {
	if s == "" {
		return nil
	}
	n, err := strconv.Atoi(s)
	if err != nil {
		return nil
	}
	return &n
}
