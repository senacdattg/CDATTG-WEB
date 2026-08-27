package models

// LmsCarpetaPersona es la carpeta raíz LMS de una persona (documento + nombre).
// No se elimina al borrar fichas; queda como archivo histórico.
type LmsCarpetaPersona struct {
	UserAuditModel
	PersonaID      uint   `gorm:"column:persona_id;uniqueIndex;not null" json:"persona_id"`
	NombreCarpeta  string `gorm:"column:nombre_carpeta;size:320;not null" json:"nombre_carpeta"`
	RutaRelativa   string `gorm:"column:ruta_relativa;size:500;not null" json:"ruta_relativa"`
	Persona        *Persona `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
}

// TableName nombre de tabla.
func (LmsCarpetaPersona) TableName() string {
	return "lms_carpetas_persona"
}
