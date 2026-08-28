package dto

// LmsAulaListItem ficha visible en Mis aulas (misma info que la tarjeta de asistencia).
type LmsAulaListItem struct {
	FichaID                  uint   `json:"ficha_id"`
	NumeroFicha              string `json:"numero_ficha"`
	NombrePrograma           string `json:"nombre_programa"`
	TipoFormacion            string `json:"tipo_formacion"`
	PuedePublicar            bool   `json:"puede_publicar"`
	CantidadAprendices       int    `json:"cantidad_aprendices"`
	InstructorNombre         string `json:"instructor_nombre"`
	SedeNombre               string `json:"sede_nombre"`
	AmbienteNombre           string `json:"ambiente_nombre"`
	JornadaNombre            string `json:"jornada_nombre"`
	ModalidadFormacionNombre string `json:"modalidad_formacion_nombre"`
	Status                   bool   `json:"status"`
}

// LmsAulaDetalle aula de una ficha (pendientes, trabajos, aprendices).
type LmsAulaDetalle struct {
	FichaID        uint               `json:"ficha_id"`
	NumeroFicha    string             `json:"numero_ficha"`
	NombrePrograma string             `json:"nombre_programa"`
	TipoFormacion  string             `json:"tipo_formacion"`
	PuedePublicar  bool               `json:"puede_publicar"`
	PuedeEntregar  bool               `json:"puede_entregar"`
	Aprendices     []LmsAulaAprendiz  `json:"aprendices"`
	Actividades    []LmsActividadItem `json:"actividades"`
}

// LmsAulaAprendiz compañero o integrante del aula.
type LmsAulaAprendiz struct {
	ID                   uint   `json:"id"`
	PersonaID            uint   `json:"persona_id"`
	Nombre               string `json:"nombre"`
	Documento            string `json:"documento"`
	Estado               bool   `json:"estado"`
	OcultoEnAsistencia   bool   `json:"oculto_en_asistencia"`
}
