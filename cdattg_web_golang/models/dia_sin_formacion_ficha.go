package models

import "time"

// DiaSinFormacionFicha marca rangos sin formación por ficha (novedades).
type DiaSinFormacionFicha struct {
	BaseModel
	FichaID     uint      `gorm:"column:ficha_id;not null;index" json:"ficha_id"`
	FechaInicio time.Time `gorm:"column:fecha_inicio;type:date;not null" json:"fecha_inicio"`
	FechaFin    time.Time `gorm:"column:fecha_fin;type:date;not null" json:"fecha_fin"`
	Motivo      string    `gorm:"size:500;not null" json:"motivo"`
	ActorUserID *uint     `gorm:"column:actor_user_id" json:"actor_user_id,omitempty"`
	Ficha       *FichaCaracterizacion `gorm:"foreignKey:FichaID" json:"ficha,omitempty"`
}

func (DiaSinFormacionFicha) TableName() string {
	return "dias_sin_formacion_ficha"
}
