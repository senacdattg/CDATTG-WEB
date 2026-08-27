package models

// LmsCarpetaFicha carpeta de una ficha dentro del tipo de formación de la persona.
// Se crea al vincular aprendiz; no se borra si se elimina o inactiva la ficha.
type LmsCarpetaFicha struct {
	UserAuditModel
	PersonaID      uint   `gorm:"column:persona_id;not null;uniqueIndex:ux_lms_carpeta_persona_ficha" json:"persona_id"`
	FichaID        uint   `gorm:"column:ficha_id;not null;uniqueIndex:ux_lms_carpeta_persona_ficha" json:"ficha_id"`
	TipoFormacion  string `gorm:"column:tipo_formacion;size:40;not null" json:"tipo_formacion"`
	NumeroFicha    string `gorm:"column:numero_ficha;size:50;not null" json:"numero_ficha"`
	NombrePrograma string `gorm:"column:nombre_programa;size:255;not null" json:"nombre_programa"`
	NombreCarpeta  string `gorm:"column:nombre_carpeta;size:320;not null" json:"nombre_carpeta"`
	RutaRelativa   string `gorm:"column:ruta_relativa;size:700;not null" json:"ruta_relativa"`
	Persona        *Persona              `gorm:"foreignKey:PersonaID" json:"persona,omitempty"`
	Ficha          *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
}

// TableName nombre de tabla.
func (LmsCarpetaFicha) TableName() string {
	return "lms_carpetas_ficha"
}
