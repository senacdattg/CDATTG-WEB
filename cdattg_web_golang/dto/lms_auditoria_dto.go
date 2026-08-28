package dto

// LmsAuditoriaPersonaItem carpeta raíz: cédula y nombre de la persona.
type LmsAuditoriaPersonaItem struct {
	PersonaID     uint   `json:"persona_id"`
	Documento     string `json:"documento"`
	Nombre        string `json:"nombre"`
	NombreCarpeta string `json:"nombre_carpeta"`
}

// LmsAuditoriaTipoItem una de las tres carpetas de tipo de formación.
type LmsAuditoriaTipoItem struct {
	Tipo           string `json:"tipo"`
	NombreCarpeta  string `json:"nombre_carpeta"`
	CantidadFichas int    `json:"cantidad_fichas"`
}

// LmsAuditoriaPersonaDetalle raíz más las tres carpetas de tipo.
type LmsAuditoriaPersonaDetalle struct {
	LmsAuditoriaPersonaItem
	Tipos []LmsAuditoriaTipoItem `json:"tipos"`
}

// LmsAuditoriaActividadItem trabajo que el aprendiz ya subió.
type LmsAuditoriaActividadItem struct {
	ActividadID          uint             `json:"actividad_id"`
	FichaID              uint             `json:"ficha_id"`
	EntregaID            uint             `json:"entrega_id"`
	Titulo               string           `json:"titulo"`
	EntregadoEn          string           `json:"entregado_en"`
	Calificacion         *float64         `json:"calificacion"`
	ComentarioInstructor string           `json:"comentario_instructor"`
	Archivos             []LmsArchivoItem `json:"archivos"`
}

// LmsAuditoriaFichaItem carpeta de ficha y las entregas de esa persona.
type LmsAuditoriaFichaItem struct {
	FichaID        uint                        `json:"ficha_id"`
	NumeroFicha    string                      `json:"numero_ficha"`
	NombrePrograma string                      `json:"nombre_programa"`
	NombreCarpeta  string                      `json:"nombre_carpeta"`
	Actividades    []LmsAuditoriaActividadItem `json:"actividades"`
}

// LmsAuditoriaTipoDetalle fichas y entregas de un tipo de formación.
type LmsAuditoriaTipoDetalle struct {
	Tipo          string                  `json:"tipo"`
	NombreCarpeta string                  `json:"nombre_carpeta"`
	Fichas        []LmsAuditoriaFichaItem `json:"fichas"`
}

// LmsAuditoriaFila fila de la tabla (nombre, cédula, ficha, programa).
type LmsAuditoriaFila struct {
	PersonaID     uint   `json:"persona_id"`
	Nombre        string `json:"nombre"`
	Documento     string `json:"documento"`
	FichaID       uint   `json:"ficha_id"`
	NumeroFicha   string `json:"numero_ficha"`
	Programa      string `json:"programa"`
	Regional      string `json:"regional"`
	Estado        bool   `json:"estado"`
	NombreCarpeta string `json:"nombre_carpeta"`
}

// LmsAuditoriaBusqueda fichas (tarjeta) o personas (carpeta raíz), según el filtro.
type LmsAuditoriaBusqueda struct {
	Fichas   []LmsAulaListItem         `json:"fichas"`
	Personas []LmsAuditoriaPersonaItem `json:"personas"`
	Total    int64                     `json:"total"`
	Page     int                       `json:"page"`
	PageSize int                       `json:"page_size"`
}
