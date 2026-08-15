// @module guarda_handler
// @description Endpoints HTTP del módulo Guardas: CRUD e importación masiva desde Excel.
// @author JDTWOR
// @created 2026-08-14
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

// GuardaHandler expone CRUD e importación masiva de guardas.
type GuardaHandler struct {
	repo      repositories.GuardaRepository
	svc       services.GuardaService
	importSvc services.PersonalRolImportService
}

// NewGuardaHandler crea el handler de guardas con sus dependencias reales.
func NewGuardaHandler() *GuardaHandler {
	return &GuardaHandler{
		repo:      repositories.NewGuardaRepository(),
		svc:       services.NewGuardaService(),
		importSvc: services.NewPersonalRolImportService(),
	}
}

// GetAll devuelve lista paginada de guardas (query: page, page_size, search).
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

// GetByID devuelve una guarda por su id (param: id).
func (h *GuardaHandler) GetByID(c *gin.Context) {
	item, ok := getRolPersonalByID(c, func(id uint) (*dto.RolPersonalItem, error) { return h.svc.GetByID(id) })
	if !ok {
		return
	}
	c.JSON(http.StatusOK, item)
}

// Update actualiza el estado de una guarda (body: {"estado": bool}).
func (h *GuardaHandler) Update(c *gin.Context) {
	if !updateRolPersonal(c, func(id uint, estado *bool) (*dto.RolPersonalItem, error) {
		return h.svc.Update(id, dto.UpdateGuardaRequest{Estado: estado})
	}) {
		return
	}
}

// Delete elimina (soft) una guarda por su id (param: id).
func (h *GuardaHandler) Delete(c *gin.Context) {
	deleteRolPersonal(c, h.svc.Delete)
}

// CreateFromPersona crea una guarda a partir de una persona existente (body: {"persona_id": uint}).
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

// ImportRolPersonal sube un Excel e importa guardas (crea persona si no existe y vincula).
func (h *GuardaHandler) ImportRolPersonal(c *gin.Context) {
	handlePersonalRolImport(c, h.importSvc, services.TipoRolGuarda)
}

// ListImports devuelve el historial de importaciones de guardas (query: limit).
func (h *GuardaHandler) ListImports(c *gin.Context) {
	handlePersonalRolListImports(c, h.importSvc, services.TipoRolGuarda)
}

// DownloadTemplate descarga la plantilla Excel para importar guardas.
func (h *GuardaHandler) DownloadTemplate(c *gin.Context) {
	handlePersonalRolTemplate(c, h.importSvc, services.TipoRolGuarda)
}