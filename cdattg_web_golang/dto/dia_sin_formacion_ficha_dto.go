package dto

type DiaSinFormacionFichaItem struct {
	ID             uint   `json:"id"`
	FichaID        uint   `json:"ficha_id"`
	FichaNumero    string `json:"ficha_numero,omitempty"`
	ProgramaNombre string `json:"programa_nombre,omitempty"`
	FechaInicio    string `json:"fecha_inicio"`
	FechaFin       string `json:"fecha_fin"`
	Motivo         string `json:"motivo"`
	CreatedAt      string `json:"created_at,omitempty"`
}

// DiaSinFormacionFichaCreateRequest registra el mismo rango/motivo en fichas
// (por IDs directos, o resolviendo sedes + tipos de formación).
type DiaSinFormacionFichaCreateRequest struct {
	FichaIDs       []uint   `json:"ficha_ids"`
	SedeIDs        []uint   `json:"sede_ids"`
	TiposFormacion []string `json:"tipos_formacion"`
	FechaInicio    string   `json:"fecha_inicio" binding:"required"`
	FechaFin       string   `json:"fecha_fin" binding:"required"`
	Motivo         string   `json:"motivo" binding:"required"`
}

type DiaSinFormacionFichaCreateResponse struct {
	Creados []DiaSinFormacionFichaItem `json:"creados"`
}
