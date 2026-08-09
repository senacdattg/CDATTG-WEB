package repositories

import (
	"errors"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const sofiaCredencialUsuarioIDWhere = "usuario_id = ?"

type SofiaCredencialRepository struct {
	db *gorm.DB
}

func NewSofiaCredencialRepository() *SofiaCredencialRepository {
	return &SofiaCredencialRepository{db: database.GetDB()}
}

// FindByUsuarioID devuelve la credencial del operador (o gorm.ErrRecordNotFound).
func (r *SofiaCredencialRepository) FindByUsuarioID(usuarioID uint) (*models.SofiaCredencial, error) {
	var c models.SofiaCredencial
	if err := r.db.Where(sofiaCredencialUsuarioIDWhere, usuarioID).First(&c).Error; err != nil {
		return nil, err
	}
	return &c, nil
}

// Upsert crea o actualiza la credencial del operador (una por usuario).
// Usa Unscoped porque soft-delete + uniqueIndex(usuario_id) provoca 23505 al reinsertar.
func (r *SofiaCredencialRepository) Upsert(c *models.SofiaCredencial) error {
	var existing models.SofiaCredencial
	err := r.db.Unscoped().Where(sofiaCredencialUsuarioIDWhere, c.UsuarioID).First(&existing).Error
	if err == nil {
		updates := map[string]interface{}{
			"tipo_documento":   c.TipoDocumento,
			"usuario":          c.Usuario,
			"password_cifrada": c.PasswordCifrada,
			"rol":              c.Rol,
			"deleted_at":       nil,
		}
		return r.db.Unscoped().Model(&existing).Updates(updates).Error
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return r.db.Create(c).Error
	}
	return err
}

// DeleteByUsuarioID borra de forma permanente la credencial del operador
// (evita chocarse con idx_sofia_credenciales_usuario_id al guardar de nuevo).
func (r *SofiaCredencialRepository) DeleteByUsuarioID(usuarioID uint) error {
	return r.db.Unscoped().Where(sofiaCredencialUsuarioIDWhere, usuarioID).Delete(&models.SofiaCredencial{}).Error
}
