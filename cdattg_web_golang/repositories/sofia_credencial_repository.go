package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type SofiaCredencialRepository struct {
	db *gorm.DB
}

func NewSofiaCredencialRepository() *SofiaCredencialRepository {
	return &SofiaCredencialRepository{db: database.GetDB()}
}

// FindByUsuarioID devuelve la credencial del operador (o gorm.ErrRecordNotFound).
func (r *SofiaCredencialRepository) FindByUsuarioID(usuarioID uint) (*models.SofiaCredencial, error) {
	var c models.SofiaCredencial
	if err := r.db.Where("usuario_id = ?", usuarioID).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

// Upsert crea o actualiza la credencial del operador (una por usuario).
func (r *SofiaCredencialRepository) Upsert(c *models.SofiaCredencial) error {
	var existing models.SofiaCredencial
	err := r.db.Where("usuario_id = ?", c.UsuarioID).First(&existing).Error
	if err == nil {
		return r.db.Model(&existing).Updates(map[string]interface{}{
			"tipo_documento":   c.TipoDocumento,
			"usuario":          c.Usuario,
			"password_cifrada": c.PasswordCifrada,
			"rol":              c.Rol,
		}).Error
	}
	if err == gorm.ErrRecordNotFound {
		return r.db.Create(c).Error
	}
	return err
}

// DeleteByUsuarioID borra la credencial del operador.
func (r *SofiaCredencialRepository) DeleteByUsuarioID(usuarioID uint) error {
	return r.db.Where("usuario_id = ?", usuarioID).Delete(&models.SofiaCredencial{}).Error
}
