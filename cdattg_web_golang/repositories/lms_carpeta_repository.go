package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// LmsCarpetaRepository persiste carpetas raíz y de ficha. No expone Delete a propósito.
type LmsCarpetaRepository interface {
	FindPersonaByPersonaID(personaID uint) (*models.LmsCarpetaPersona, error)
	CreatePersona(row *models.LmsCarpetaPersona) error
	FindFicha(personaID, fichaID uint) (*models.LmsCarpetaFicha, error)
	CreateFicha(row *models.LmsCarpetaFicha) error
	SearchPersonas(q string, limite int, soloFichaIDs []uint) ([]models.LmsCarpetaPersona, error)
	ListFichasByPersona(personaID uint) ([]models.LmsCarpetaFicha, error)
}

type lmsCarpetaRepository struct {
	db *gorm.DB
}

// NewLmsCarpetaRepository constructor.
func NewLmsCarpetaRepository() LmsCarpetaRepository {
	return &lmsCarpetaRepository{db: database.GetDB()}
}

func (r *lmsCarpetaRepository) FindPersonaByPersonaID(personaID uint) (*models.LmsCarpetaPersona, error) {
	var row models.LmsCarpetaPersona
	if err := r.db.Preload("Persona").Where("persona_id = ?", personaID).First(&row).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *lmsCarpetaRepository) CreatePersona(row *models.LmsCarpetaPersona) error {
	return r.db.Create(row).Error
}

func (r *lmsCarpetaRepository) FindFicha(personaID, fichaID uint) (*models.LmsCarpetaFicha, error) {
	var row models.LmsCarpetaFicha
	if err := r.db.Where("persona_id = ? AND ficha_id = ?", personaID, fichaID).First(&row).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *lmsCarpetaRepository) CreateFicha(row *models.LmsCarpetaFicha) error {
	return r.db.Create(row).Error
}
