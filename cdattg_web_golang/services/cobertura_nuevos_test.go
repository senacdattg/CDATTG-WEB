package services

import (
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/models/inventario"
	"github.com/xuri/excelize/v2"
)

func TestCoberturaFiltrarFilasNivelImportable(t *testing.T) {
	t.Parallel()
	row := func(nivel string) []string {
		r := make([]string, colNivel+1)
		r[colNivel] = nivel
		return r
	}
	rows := [][]string{
		{"header"},
		row("TÉCNICO"),
		row("TECNOLOGO"),
		row("ESPECIALIZACION"),
		row("operario"),
		{"corta"},
	}
	got := filtrarFilasNivelImportable(rows)
	if len(got) != 3 {
		t.Fatalf("candidatos=%d want 3", len(got))
	}
}

func TestCoberturaAgruparProgramasPorCodigoMaxVersion(t *testing.T) {
	t.Parallel()
	mk := func(codigo, ver string) []string {
		r := make([]string, colVersion+1)
		r[colCodigo] = codigo
		r[colVersion] = ver
		return r
	}
	by := agruparProgramasPorCodigoMaxVersion([][]string{
		mk("A1", "1"),
		mk("A1", "3"),
		mk("A1", "2"),
		mk("", "9"),
		{"solo"},
	})
	if len(by) != 1 || by["A1"].version != 3 {
		t.Fatalf("got=%+v", by)
	}
}

func TestCoberturaOpenCatalogoExcelRows(t *testing.T) {
	t.Parallel()
	f := excelize.NewFile()
	sheet := f.GetSheetName(0)
	_ = f.SetCellValue(sheet, "A1", "COD")
	_ = f.SetCellValue(sheet, "A2", "1")
	buf, err := f.WriteToBuffer()
	if err != nil {
		t.Fatal(err)
	}
	rows, err := openCatalogoExcelRows(buf.Bytes())
	if err != nil || len(rows) < 2 {
		t.Fatalf("rows=%v err=%v", len(rows), err)
	}
	_, err = openCatalogoExcelRows([]byte("no-es-excel"))
	if err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCoberturaNormalizeAccentsAndParseInt(t *testing.T) {
	t.Parallel()
	if normalizeAccents("ÁÉÍÓÚÑ") != "AEIOUN" {
		t.Fatal(normalizeAccents("ÁÉÍÓÚÑ"))
	}
	if parseInt("") != nil || parseInt("x") != nil {
		t.Fatal("parseInt inválido")
	}
	if v := parseInt("12"); v == nil || *v != 12 {
		t.Fatal(v)
	}
}

func TestCoberturaAssignOrCreateRedConocimiento(t *testing.T) {
	t.Parallel()
	req := &dto.ProgramaFormacionRequest{}
	redByName := map[string]uint{"REDES": 7}
	created := 0
	if err := assignOrCreateRedConocimiento(req, "", redByName, &created, nil); err != nil {
		t.Fatal(err)
	}
	if req.RedConocimientoID != nil {
		t.Fatal("sin red")
	}
	if err := assignOrCreateRedConocimiento(req, "Redes", redByName, &created, nil); err != nil {
		t.Fatal(err)
	}
	if req.RedConocimientoID == nil || *req.RedConocimientoID != 7 {
		t.Fatalf("%v", req.RedConocimientoID)
	}
}

func TestCoberturaSortedCodigos(t *testing.T) {
	t.Parallel()
	got := sortedCodigos(map[string]catalogoFilaVersion{"B": {}, "A": {}})
	if strings.Join(got, ",") != "A,B" {
		t.Fatal(got)
	}
}

func TestCoberturaProgramaImportToModel(t *testing.T) {
	t.Parallel()
	s := &programaFormacionImportService{}
	st := true
	p := s.toModel(dto.ProgramaFormacionRequest{Codigo: "X", Nombre: " prog ", Status: &st})
	if p.Codigo != "X" || p.Nombre != "PROG" || !p.Status {
		t.Fatalf("%+v", p)
	}
}

type stubRedRepo struct {
	createErr error
	nextID    uint
}

func (s *stubRedRepo) FindAll() ([]models.RedConocimiento, error) { return nil, nil }
func (s *stubRedRepo) FindByID(uint) (*models.RedConocimiento, error) {
	return nil, errors.New("n/a")
}
func (s *stubRedRepo) FindByName(string) (*models.RedConocimiento, error) {
	return nil, errors.New("n/a")
}
func (s *stubRedRepo) Create(r *models.RedConocimiento) error {
	if s.createErr != nil {
		return s.createErr
	}
	s.nextID++
	r.ID = s.nextID
	return nil
}

func TestCoberturaAssignOrCreateRedConocimiento_Crea(t *testing.T) {
	t.Parallel()
	req := &dto.ProgramaFormacionRequest{}
	redByName := map[string]uint{}
	created := 0
	repo := &stubRedRepo{}
	if err := assignOrCreateRedConocimiento(req, "Nueva Red", redByName, &created, repo); err != nil {
		t.Fatal(err)
	}
	if created != 1 || req.RedConocimientoID == nil || *req.RedConocimientoID != 1 {
		t.Fatalf("created=%d id=%v", created, req.RedConocimientoID)
	}
	repo.createErr = errors.New("fail")
	if err := assignOrCreateRedConocimiento(req, "Otra", map[string]uint{}, &created, repo); err == nil {
		t.Fatal("esperaba error")
	}
}

func TestCoberturaValidateFechaDevolucionPrestamo(t *testing.T) {
	t.Parallel()
	hoy := time.Now().Truncate(24 * time.Hour)
	pasado := hoy.Add(-24 * time.Hour)
	futuro := hoy.Add(48 * time.Hour)
	if err := validateFechaDevolucionPrestamo("consumo", nil); err != nil {
		t.Fatal(err)
	}
	if err := validateFechaDevolucionPrestamo("prestamo", nil); err == nil {
		t.Fatal("nil fecha")
	}
	if err := validateFechaDevolucionPrestamo("prestamo", &pasado); err == nil {
		t.Fatal("pasado")
	}
	if err := validateFechaDevolucionPrestamo("prestamo", &futuro); err != nil {
		t.Fatal(err)
	}
}

type stubProductoRepoOrden struct {
	prod *inventario.Producto
	err  error
}

func (s *stubProductoRepoOrden) Create(*inventario.Producto) error { return nil }
func (s *stubProductoRepoOrden) Update(*inventario.Producto) error { return nil }
func (s *stubProductoRepoOrden) FindByID(uint) (*inventario.Producto, error) {
	return s.prod, s.err
}
func (s *stubProductoRepoOrden) FindAll(int, int) ([]inventario.Producto, int64, error) {
	return nil, 0, nil
}
func (s *stubProductoRepoOrden) FindByName(string) (*inventario.Producto, error) { return nil, nil }
func (s *stubProductoRepoOrden) FindByCodigoBarras(string) (*inventario.Producto, error) {
	return nil, nil
}
func (s *stubProductoRepoOrden) Delete(*inventario.Producto) error                 { return nil }
func (s *stubProductoRepoOrden) CountByCategoriaID(uint) (int64, error)            { return 0, nil }
func (s *stubProductoRepoOrden) CountByMarcaID(uint) (int64, error)                { return 0, nil }
func (s *stubProductoRepoOrden) CountByProveedorID(uint) (int64, error)            { return 0, nil }
func (s *stubProductoRepoOrden) CountByContratoConvenioID(uint) (int64, error)     { return 0, nil }
func (s *stubProductoRepoOrden) CountTotal() (int64, error)                        { return 0, nil }
func (s *stubProductoRepoOrden) CountStockBajo(int) (int64, error)                 { return 0, nil }
func (s *stubProductoRepoOrden) CountStockCritico(int) (int64, error)              { return 0, nil }

func TestCoberturaValidateStockItems(t *testing.T) {
	t.Parallel()
	disp := 5
	svc := &ordenService{productoRepo: &stubProductoRepoOrden{prod: &inventario.Producto{Name: "Cable", Cantidad: &disp}}}
	if err := svc.validateStockItems([]carritoItemStock{{ProductoID: 1, Cantidad: 3}}); err != nil {
		t.Fatal(err)
	}
	if err := svc.validateStockItems([]carritoItemStock{{ProductoID: 1, Cantidad: 9}}); err == nil {
		t.Fatal("stock")
	}
	svc.productoRepo = &stubProductoRepoOrden{err: errors.New("x")}
	if err := svc.validateStockItems([]carritoItemStock{{ProductoID: 2, Cantidad: 1}}); err == nil {
		t.Fatal("missing")
	}
}

func TestCoberturaPersonaImportHelpers(t *testing.T) {
	t.Parallel()
	idx := buildImportColIndex([]string{"Número de Documento", "Primer Nombre", "Primer Apellido", "Correo"})
	if err := validateRequiredImportColumns(idx); err != nil {
		t.Fatal(err)
	}
	if err := validateRequiredImportColumns(map[string]int{}); err == nil {
		t.Fatal("required")
	}
	if !isDuplicatePersonaError(errors.New("documento ya está registrado")) {
		t.Fatal("dup")
	}
	if isDuplicatePersonaError(errors.New("otro")) {
		t.Fatal("no dup")
	}
	svc := &personaImportService{}
	req := svc.rowToPersonaRequest(
		[]string{"CC", "123", "Ana", "", "Perez", "", "a@b.com", "300"},
		map[string]int{
			"tipo_documento": 0, "numero_documento": 1, "primer_nombre": 2,
			"segundo_nombre": 3, "primer_apellido": 4, "segundo_apellido": 5,
			"correo": 6, "celular": 7,
		},
		map[string]uint{"cc": 9},
	)
	if req == nil || req.NumeroDocumento != "123" || req.TipoDocumento == nil || *req.TipoDocumento != 9 {
		t.Fatalf("%+v", req)
	}
	if svc.rowToPersonaRequest([]string{"", "", ""}, map[string]int{"numero_documento": 0, "primer_nombre": 1, "primer_apellido": 2}, nil) != nil {
		t.Fatal("empty")
	}
}

func TestCoberturaBloquesDelDiaAndExtension(t *testing.T) {
	t.Parallel()
	bloques := []models.JornadaBloque{
		{DiaFormacionID: 1, HoraInicio: "06:00", HoraFin: "12:00"},
		{DiaFormacionID: 2, HoraInicio: "14:00", HoraFin: "18:00"},
	}
	hoy := bloquesDelDia(bloques, 1)
	if len(hoy) != 1 || hoy[0].HoraInicio != "06:00" {
		t.Fatalf("%+v", hoy)
	}
	ext := 15
	j := &models.Jornada{MinutosExtensionFin: &ext}
	if extensionMinutosFromJornada(j) != 15 {
		t.Fatal(extensionMinutosFromJornada(j))
	}
	if ValidarHorarioJornadaModel(nil) != true {
		t.Fatal("nil jornada")
	}
	jLegacy := &models.Jornada{HoraInicio: "06:00", HoraFin: "22:00"}
	now := time.Now()
	_ = ValidarHorarioJornadaModelAt(jLegacy, now)
}

func TestCoberturaEmitProgressAndOpenWorkbook(t *testing.T) {
	t.Parallel()
	called := false
	emitProgress(func(p ImportProgress) { called = true }, ImportProgress{Type: "progress"})
	if !called {
		t.Fatal("progress")
	}
	emitProgress(nil, ImportProgress{})

	f := excelize.NewFile()
	sheet := f.GetSheetName(0)
	_ = f.SetCellValue(sheet, "A1", "numero_documento")
	_ = f.SetCellValue(sheet, "B1", "primer_nombre")
	_ = f.SetCellValue(sheet, "C1", "primer_apellido")
	_ = f.SetCellValue(sheet, "A2", "1")
	_ = f.SetCellValue(sheet, "B2", "Ana")
	_ = f.SetCellValue(sheet, "C2", "Perez")
	buf, err := f.WriteToBuffer()
	if err != nil {
		t.Fatal(err)
	}
	rows, idx, err := openPersonaImportWorkbook(buf.Bytes())
	if err != nil || len(rows) < 2 || idx["numero_documento"] != 0 {
		t.Fatalf("rows=%d idx=%v err=%v", len(rows), idx, err)
	}
}

func TestCoberturaRowToProgramaRequest(t *testing.T) {
	t.Parallel()
	s := &programaFormacionImportService{}
	row := make([]string, colRedConoc+1)
	row[colCodigo] = "P1"
	row[colNombre] = "Programa Uno"
	row[colNivel] = "TECNICO"
	row[colHorasTot] = "100"
	row[colHorasLect] = "60"
	row[colHorasProd] = "40"
	row[colRedConoc] = "Red X"
	nivelID := uint(3)
	tipoID := uint(8)
	redByName := map[string]uint{"RED X": 5}
	created := 0
	req, err := s.rowToProgramaRequest(row, map[string]uint{"TECNICO": nivelID}, &tipoID, redByName, &created, nil)
	if err != nil || req == nil || req.NivelFormacionID == nil || *req.NivelFormacionID != 3 {
		t.Fatalf("%+v err=%v", req, err)
	}
	empty, err := s.rowToProgramaRequest([]string{"", ""}, nil, nil, nil, &created, nil)
	if err != nil || empty != nil {
		t.Fatal("empty row")
	}
}

func TestCoberturaImportProgramasFromCodigoMap(t *testing.T) {
	t.Parallel()
	row := make([]string, colNombre+1)
	row[colCodigo] = "Z9"
	row[colNombre] = "Prog"
	svc := &programaFormacionImportService{
		programaRepo: &stubProgramaRepo{exists: true},
	}
	processed, dup, errCount, _ := svc.importProgramasFromCodigoMap(
		map[string]catalogoFilaVersion{"Z9": {version: 1, row: row}},
		importCatalogMaps{nivelByName: map[string]uint{}, redByName: map[string]uint{}},
	)
	if processed != 0 || dup != 1 || errCount != 0 {
		t.Fatalf("p=%d d=%d e=%d", processed, dup, errCount)
	}
}

type stubProgramaRepo struct {
	exists bool
}

func (s *stubProgramaRepo) FindAll(int, int, string) ([]models.ProgramaFormacion, int64, error) {
	return nil, 0, nil
}
func (s *stubProgramaRepo) FindByID(uint) (*models.ProgramaFormacion, error) { return nil, errors.New("x") }
func (s *stubProgramaRepo) FindFirstByNombreContaining(string) (*models.ProgramaFormacion, error) {
	return nil, errors.New("x")
}
func (s *stubProgramaRepo) Create(*models.ProgramaFormacion) error      { return nil }
func (s *stubProgramaRepo) Update(*models.ProgramaFormacion) error      { return nil }
func (s *stubProgramaRepo) Delete(uint) error                           { return nil }
func (s *stubProgramaRepo) ExistsByCodigo(string) bool                  { return s.exists }
func (s *stubProgramaRepo) ExistsByCodigoExcludingID(string, uint) bool { return false }

func TestCoberturaHoraFinEfectiva(t *testing.T) {
	t.Parallel()
	dia := time.Date(2026, 6, 21, 0, 0, 0, 0, time.Local)
	if !HoraFinEfectiva(nil, dia).After(dia) {
		t.Fatal("nil")
	}
	j := &models.Jornada{HoraFin: "12:00"}
	fin := HoraFinEfectiva(j, dia)
	if fin.Hour() < 12 {
		t.Fatalf("%v", fin)
	}
	_ = HoraInicioMasMinutos(j, dia, 10)
	_ = maxHoraFinDeBloques([]HorarioBloqueInput{{HoraFin: "10:00"}, {HoraFin: "11:30"}})
	_ = instanteHoraEnDia(dia, "08:15")
}
