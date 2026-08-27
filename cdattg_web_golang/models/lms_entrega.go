package models

import "time"

// LmsEntrega envío del aprendiz a una actividad del aula.
type LmsEntrega struct {
	UserAuditModel
	ActividadID          uint      `gorm:"column:actividad_id;not null;uniqueIndex:ux_lms_entrega_act_ap" json:"actividad_id"`
	AprendizID           uint      `gorm:"column:aprendiz_id;not null;uniqueIndex:ux_lms_entrega_act_ap" json:"aprendiz_id"`
	ComentarioAprendiz   string    `gorm:"column:comentario_aprendiz;type:text" json:"comentario_aprendiz"`
	Calificacion         *float64  `gorm:"column:calificacion" json:"calificacion"`
	ComentarioInstructor string    `gorm:"column:comentario_instructor;type:text" json:"comentario_instructor"`
	EntregadoEn          time.Time `gorm:"column:entregado_en" json:"entregado_en"`
	Actividad            *LmsActividad `gorm:"foreignKey:ActividadID" json:"actividad,omitempty"`
	Aprendiz             *Aprendiz     `gorm:"foreignKey:AprendizID" json:"aprendiz,omitempty"`
	Archivos             []LmsEntregaArchivo `gorm:"foreignKey:EntregaID" json:"archivos,omitempty"`
}

// TableName nombre de tabla.
func (LmsEntrega) TableName() string {
	return "lms_entregas"
}
