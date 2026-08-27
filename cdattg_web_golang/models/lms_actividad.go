package models

import "time"

// Tipos de publicación LMS (tablón, guía, material o trabajo de clase).
const (
	LmsActividadTablon   = "TABLON"
	LmsActividadGuia     = "GUIA"
	LmsActividadMaterial = "MATERIAL"
	LmsActividadTrabajo  = "TRABAJO"
)

// LmsActividad publicación del instructor en un aula (ficha).
// UserCreateID queda para auditoría posterior (quién publicó).
type LmsActividad struct {
	UserAuditModel
	FichaID         uint                  `gorm:"column:ficha_id;not null;index" json:"ficha_id"`
	Tipo            string                `gorm:"column:tipo;size:20;not null" json:"tipo"`
	Titulo          string                `gorm:"column:titulo;size:255;not null" json:"titulo"`
	Cuerpo          string                `gorm:"column:cuerpo;type:text" json:"cuerpo"`
	HabilitaCarga   bool                  `gorm:"column:habilita_carga;default:false" json:"habilita_carga"`
	CalificacionMax *float64              `gorm:"column:calificacion_max" json:"calificacion_max"`
	PlazoEntrega    *time.Time            `gorm:"column:plazo_entrega" json:"plazo_entrega"`
	Ficha           *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
	Archivos        []LmsActividadArchivo `gorm:"foreignKey:ActividadID" json:"archivos,omitempty"`
}

// TableName nombre de tabla.
func (LmsActividad) TableName() string {
	return "lms_actividades"
}

// LmsTipoActividadValido indica si el tipo es uno de los cuatro permitidos.
func LmsTipoActividadValido(tipo string) bool {
	switch tipo {
	case LmsActividadTablon, LmsActividadGuia, LmsActividadMaterial, LmsActividadTrabajo:
		return true
	default:
		return false
	}
}
