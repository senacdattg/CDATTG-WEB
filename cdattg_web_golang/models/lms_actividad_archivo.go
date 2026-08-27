package models

// LmsActividadArchivo adjunto de una publicación del tablón.
// Persistido en storage/lms/publicaciones/{ficha}/{actividad}.
// @author Cristian Deysdayr Jiménez
type LmsActividadArchivo struct {
	UserAuditModel
	ActividadID    uint          `gorm:"column:actividad_id;not null;index" json:"actividad_id"`
	NombreOriginal string        `gorm:"column:nombre_original;size:255;not null" json:"nombre_original"`
	RutaRelativa   string        `gorm:"column:ruta_relativa;size:500;not null" json:"ruta_relativa"`
	Mime           string        `gorm:"column:mime;size:120" json:"mime"`
	Tamano         int64         `gorm:"column:tamano" json:"tamano"`
	Actividad      *LmsActividad `gorm:"foreignKey:ActividadID" json:"actividad,omitempty"`
}

// TableName nombre de tabla.
func (LmsActividadArchivo) TableName() string {
	return "lms_actividad_archivos"
}
