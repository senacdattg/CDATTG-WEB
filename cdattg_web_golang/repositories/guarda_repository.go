// @module guarda_repository
// @description Acceso a datos de Guardas (listado paginado con JOIN a Persona y CRUD).
// @author JDTWOR
// @created 2026-08-14
package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

type GuardaRepository interface {
	FindAllPaginated(offset, limit int, search string) ([]models.Guarda, int64, error)
	FindByID(id uint) (*models.Guarda, error)
	FindByPersonaID(personaID uint) (*models.Guarda, error)
	Create(guarda *models.Guarda) error
	Update(guarda *models.Guarda) error
	Delete(id uint) error
}

type guardaRepository struct {
	db *gorm.DB
}

func NewGuardaRepository() GuardaRepository {
	return &guardaRepository{db: database.GetDB()}
}

func (r *guardaRepository) FindAllPaginated(offset, limit int, search string) ([]models.Guarda, int64, error) {
	var list []models.Guarda
	joinClause := "LEFT JOIN personas ON personas.id = guardas.persona_id"
	q := r.db.Model(&models.Guarda{}).Joins(joinClause)
	q = applyPersonasSearch(q, search, "personas.")
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	findQuery := r.db.Joins(joinClause)
	findQuery = applyPersonasSearch(findQuery, search, "personas.")
	if err := findQuery.Offset(offset).Limit(limit).Find(&list).Error; err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func (r *guardaRepository) FindByID(id uint) (*models.Guarda, error) {
	var m models.Guarda
	if err := r.db.Joins("Persona").First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *guardaRepository) FindByPersonaID(personaID uint) (*models.Guarda, error) {
	var m models.Guarda
	if err := r.db.Where("persona_id = ?", personaID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *guardaRepository) Create(guarda *models.Guarda) error {
	return r.db.Create(guarda).Error
}

func (r *guardaRepository) Update(guarda *models.Guarda) error {
	return r.db.Save(guarda).Error
}

func (r *guardaRepository) Delete(id uint) error {
	return r.db.Delete(&models.Guarda{}, id).Error
}