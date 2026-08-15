package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

// GuardaHandler expone CRUD e importación masiva de guardas.
type GuardaHandler struct {
	repo      repositories.GuardaRepository
	svc       services.GuardaService
	importSvc services.PersonalRolImportService
}

func NewGuardaHandler() *GuardaHandler {
	return &GuardaHandler{
		repo:      repositories.NewGuardaRepository(),
		svc:       services.NewGuardaService(),
		importSvc: services.NewPersonalRolImportService(),
	}
}

// PersonalAdministrativoHandler expone CRUD e importación masiva de personal administrativo.
type PersonalAdministrativoHandler struct {
	repo      repositories.PersonalAdministrativoRepository
	svc       services.PersonalAdministrativoService
	importSvc services.PersonalRolImportService
}

func NewPersonalAdministrativoHandler() *PersonalAdministrativoHandler {
	return &PersonalAdministrativoHandler{
		repo:      repositories.NewPersonalAdministrativoRepository(),
		svc:       services.NewPersonalAdministrativoService(),
		importSvc: services.NewPersonalRolImportService(),
	}
}

// GetAll devuelve lista paginada (query: page, page_size, search).
func (h *GuardaHandler) GetAll(c *gin.Context) {
	page, pageSize, search := readPaginationParams(c)
	offset := (page - 1) * pageSize
	list, total, err := h.repo.FindAllPaginated(offset, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.RolPersonalItem, len(list))
	for i := range list {
		resp[i] = guardaToRolItem(list[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": resp, "total": total, "page": page, "page_size": pageSize})
}

func (h *PersonalAdministrativoHandler) GetAll(c *gin.Context) {
	page, pageSize, search := readPaginationParams(c)
	offset := (page - 1) * pageSize
	list, total, err := h.repo.FindAllPaginated(offset, pageSize, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	resp := make([]dto.RolPersonalItem, len(list))
	for i := range list {
		resp[i] = personalAdministrativoToRolItem(list[i])
	}
	c.JSON(http.StatusOK, gin.H{"data": resp, "total": total, "page": page, "page_size": pageSize})
}

func (h *GuardaHandler) GetByID(c *gin.Context) {
	item, ok := getRolPersonalByID(c, func(id uint) (*dto.RolPersonalItem, error) { return h.svc.GetByID(id) })
	if !ok {
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *PersonalAdministrativoHandler) GetByID(c *gin.Context) {
	item, ok := getRolPersonalByID(c, func(id uint) (*dto.RolPersonalItem, error) { return h.svc.GetByID(id) })
	if !ok {
		return
	}
	c.JSON(http.StatusOK, item)
}

func (h *GuardaHandler) Update(c *gin.Context) {
	if !updateRolPersonal(c, func(id uint, estado *bool) (*dto.RolPersonalItem, error) {
		return h.svc.Update(id, dto.UpdateGuardaRequest{Estado: estado})
	}) {
		return
	}
}

func (h *PersonalAdministrativoHandler) Update(c *gin.Context) {
	if !updateRolPersonal(c, func(id uint, estado *bool) (*dto.RolPersonalItem, error) {
		return h.svc.Update(id, dto.UpdatePersonalAdministrativoRequest{Estado: estado})
	}) {
		return
	}
}

func (h *GuardaHandler) Delete(c *gin.Context) {
	deleteRolPersonal(c, h.svc.Delete)
}

func (h *PersonalAdministrativoHandler) Delete(c *gin.Context) {
	deleteRolPersonal(c, h.svc.Delete)
}

func (h *GuardaHandler) CreateFromPersona(c *gin.Context) {
	var req dto.CreateGuardaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return
	}
	item, err := h.svc.CreateFromPersona(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *PersonalAdministrativoHandler) CreateFromPersona(c *gin.Context) {
	var req dto.CreatePersonalAdministrativoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return
	}
	item, err := h.svc.CreateFromPersona(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

// ImportRolPersonal sube un Excel e importa guardas o personal administrativo (crea persona si no existe y vincula).
func (h *GuardaHandler) ImportRolPersonal(c *gin.Context) {
	handlePersonalRolImport(c, h.importSvc, services.TipoRolGuarda)
}

func (h *PersonalAdministrativoHandler) ImportRolPersonal(c *gin.Context) {
	handlePersonalRolImport(c, h.importSvc, services.TipoRolPersonalAdministrativo)
}

func (h *GuardaHandler) ListImports(c *gin.Context) {
	handlePersonalRolListImports(c, h.importSvc, services.TipoRolGuarda)
}

func (h *PersonalAdministrativoHandler) ListImports(c *gin.Context) {
	handlePersonalRolListImports(c, h.importSvc, services.TipoRolPersonalAdministrativo)
}

func (h *GuardaHandler) DownloadTemplate(c *gin.Context) {
	handlePersonalRolTemplate(c, h.importSvc, services.TipoRolGuarda)
}

func (h *PersonalAdministrativoHandler) DownloadTemplate(c *gin.Context) {
	handlePersonalRolTemplate(c, h.importSvc, services.TipoRolPersonalAdministrativo)
}

// ---- Helpers compartidos ----

// readPaginationParams lee page/page_size/search de la query (revisa valores sensatos).
func readPaginationParams(c *gin.Context) (int, int, string) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return page, pageSize, c.Query("search")
}

func getRolPersonalByID(c *gin.Context, get func(id uint) (*dto.RolPersonalItem, error)) (*dto.RolPersonalItem, bool) {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgIDInvalido})
		return nil, false
	}
	item, err := get(uint(idNum))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return nil, false
	}
	return item, true
}

func updateRolPersonal(c *gin.Context, update func(id uint, estado *bool) (*dto.RolPersonalItem, error)) bool {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgIDInvalido})
		return false
	}
	var req struct {
		Estado *bool `json:"estado"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgDatosInvalidos, "details": err.Error()})
		return false
	}
	item, err := update(uint(idNum), req.Estado)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return false
	}
	c.JSON(http.StatusOK, item)
	return true
}

func deleteRolPersonal(c *gin.Context, del func(id uint) error) {
	idNum, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsgIDInvalido})
		return
	}
	if err := del(uint(idNum)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func handlePersonalRolImport(c *gin.Context, importSvc services.PersonalRolImportService, tipo string) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuario no autenticado"})
		return
	}
	userID := userIDVal.(uint)

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Se requiere el archivo 'file'"})
		return
	}
	if file.Size == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo está vacío"})
		return
	}
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo no debe superar 10 MB"})
		return
	}
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer el archivo"})
		return
	}
	defer f.Close()
	buf := make([]byte, file.Size)
	if _, err := f.Read(buf); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo el archivo"})
		return
	}

	result, err := importSvc.ImportFromExcel(tipo, buf, file.Filename, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func handlePersonalRolListImports(c *gin.Context, importSvc services.PersonalRolImportService, tipo string) {
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if err != nil || limit < 1 {
		limit = 50
	}
	list, err := importSvc.ListImports(tipo, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": list})
}

func handlePersonalRolTemplate(c *gin.Context, importSvc services.PersonalRolImportService, tipo string) {
	buf, filename, err := importSvc.GenerarPlantilla(tipo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf)
}

// guardaToRolItem: documento y nombre desde Persona (guarda solo tiene persona_id).
func guardaToRolItem(m models.Guarda) dto.RolPersonalItem {
	var nombre, doc string
	if m.Persona != nil {
		nombre = m.Persona.GetFullName()
		doc = m.Persona.NumeroDocumento
	}
	if nombre == "" {
		nombre = m.NombreCompletoCache
	}
	if doc == "" {
		doc = m.NumeroDocumentoCache
	}
	return dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}

// personalAdministrativoToRolItem: documento y nombre desde Persona (personal administrativo solo tiene persona_id).
func personalAdministrativoToRolItem(m models.PersonalAdministrativo) dto.RolPersonalItem {
	var nombre, doc string
	if m.Persona != nil {
		nombre = m.Persona.GetFullName()
		doc = m.Persona.NumeroDocumento
	}
	if nombre == "" {
		nombre = m.NombreCompletoCache
	}
	if doc == "" {
		doc = m.NumeroDocumentoCache
	}
	return dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}