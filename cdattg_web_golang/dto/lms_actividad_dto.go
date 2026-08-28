package dto

import "time"

// LmsArchivoItem adjunto visible de una publicación o entrega.
type LmsArchivoItem struct {
	ID     uint   `json:"id"`
	Nombre string `json:"nombre"`
	Tamano int64  `json:"tamano"`
}

// LmsActividadItem publicación visible en tablón o trabajos.
type LmsActividadItem struct {
	ID               uint             `json:"id"`
	Tipo             string           `json:"tipo"`
	Titulo           string           `json:"titulo"`
	Cuerpo           string           `json:"cuerpo"`
	HabilitaCarga    bool             `json:"habilita_carga"`
	CalificacionMax  *float64         `json:"calificacion_max"`
	PlazoEntrega     *time.Time       `json:"plazo_entrega"`
	CreadoEn         string           `json:"creado_en"`
	InstructorNombre string           `json:"instructor_nombre"`
	Archivos         []LmsArchivoItem `json:"archivos"`
}

// LmsActividadRequest alta o edición de publicación (título, descripción y plazo opcional).
type LmsActividadRequest struct {
	Titulo          string     `json:"titulo" binding:"required"`
	Cuerpo          string     `json:"cuerpo"`
	PlazoEntrega    *time.Time `json:"plazo_entrega"`
	HabilitaCarga   bool       `json:"habilita_carga"`
	CalificacionMax *float64   `json:"calificacion_max"`
}

// LmsActividadDetalle vista de una actividad (alumno o instructor).
type LmsActividadDetalle struct {
	LmsActividadItem
	PuedePublicar bool             `json:"puede_publicar"`
	PuedeEntregar bool             `json:"puede_entregar"`
	MiEntrega     *LmsEntregaItem  `json:"mi_entrega"`
	Entregas      []LmsEntregaItem `json:"entregas"`
}

// LmsEntregaItem envío de un aprendiz.
type LmsEntregaItem struct {
	ID                   uint             `json:"id"`
	AprendizID           uint             `json:"aprendiz_id"`
	AprendizNombre       string           `json:"aprendiz_nombre"`
	Documento            string           `json:"documento"`
	EntregadoEn          string           `json:"entregado_en"`
	Tardia               bool             `json:"tardia"`
	Calificacion         *float64         `json:"calificacion"`
	ComentarioInstructor string           `json:"comentario_instructor"`
	Archivos             []LmsArchivoItem `json:"archivos"`
}

// LmsNotaRequest calificación 0-100 y comentario del instructor.
type LmsNotaRequest struct {
	Calificacion *float64 `json:"calificacion"`
	Comentario   string   `json:"comentario"`
}
