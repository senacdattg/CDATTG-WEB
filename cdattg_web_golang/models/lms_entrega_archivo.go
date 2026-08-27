package models

// LmsEntregaArchivo adjunto subido por el aprendiz.
type LmsEntregaArchivo struct {
	UserAuditModel
	EntregaID      uint   `gorm:"column:entrega_id;not null;index" json:"entrega_id"`
	NombreOriginal string `gorm:"column:nombre_original;size:255;not null" json:"nombre_original"`
	RutaRelativa   string `gorm:"column:ruta_relativa;size:500;not null" json:"ruta_relativa"`
	Mime           string `gorm:"column:mime;size:120" json:"mime"`
	Tamano         int64  `gorm:"column:tamano" json:"tamano"`
	Entrega        *LmsEntrega `gorm:"foreignKey:EntregaID" json:"entrega,omitempty"`
}

// TableName nombre de tabla.
func (LmsEntregaArchivo) TableName() string {
	return "lms_entrega_archivos"
}
