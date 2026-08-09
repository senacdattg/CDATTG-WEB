package models

// SofiaCredencial guarda las credenciales de SofiaPlus de un operador del sistema.
// La contraseña se almacena SIEMPRE cifrada (AES-GCM); nunca en texto plano.
type SofiaCredencial struct {
	BaseModel
	UsuarioID       uint   `gorm:"uniqueIndex;not null;column:usuario_id" json:"usuario_id"`
	TipoDocumento   string `gorm:"not null" json:"tipo_documento"`
	Usuario         string `gorm:"not null" json:"usuario"`
	PasswordCifrada string `gorm:"not null;column:password_cifrada" json:"-"` // nunca se expone en JSON
	Rol             string `json:"rol"`
}

func (SofiaCredencial) TableName() string {
	return "sofia_credenciales"
}
