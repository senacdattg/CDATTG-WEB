package repositories

import (
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

const preloadFichaProgramaFormacion = "Ficha.ProgramaFormacion"

type DiaSinFormacionFichaRepository interface {
	Create(row *models.DiaSinFormacionFicha) error
	Delete(id uint) error
	FindByID(id uint) (*models.DiaSinFormacionFicha, error)
	ListByFicha(fichaID uint) ([]models.DiaSinFormacionFicha, error)
	ListAll() ([]models.DiaSinFormacionFicha, error)
	ExistsEnFecha(fichaID uint, fecha time.Time) (bool, string, error)
	FindEnRango(fichaID uint, desde, hasta time.Time) ([]models.DiaSinFormacionFicha, error)
}

type diaSinFormacionFichaRepository struct{}

func NewDiaSinFormacionFichaRepository() DiaSinFormacionFichaRepository {
	return &diaSinFormacionFichaRepository{}
}

func (r *diaSinFormacionFichaRepository) dbWithFichaPreloads() *gorm.DB {
	return database.GetDB().
		Preload("Ficha").
		Preload(preloadFichaProgramaFormacion)
}

func (r *diaSinFormacionFichaRepository) Create(row *models.DiaSinFormacionFicha) error {
	return database.GetDB().Create(row).Error
}

func (r *diaSinFormacionFichaRepository) Delete(id uint) error {
	return database.GetDB().Delete(&models.DiaSinFormacionFicha{}, id).Error
}

func (r *diaSinFormacionFichaRepository) FindByID(id uint) (*models.DiaSinFormacionFicha, error) {
	var row models.DiaSinFormacionFicha
	if err := r.dbWithFichaPreloads().First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *diaSinFormacionFichaRepository) ListByFicha(fichaID uint) ([]models.DiaSinFormacionFicha, error) {
	var list []models.DiaSinFormacionFicha
	err := r.dbWithFichaPreloads().
		Where("ficha_id = ?", fichaID).
		Order("fecha_inicio DESC").
		Find(&list).Error
	return list, err
}

func (r *diaSinFormacionFichaRepository) ListAll() ([]models.DiaSinFormacionFicha, error) {
	var list []models.DiaSinFormacionFicha
	err := r.dbWithFichaPreloads().
		Order("fecha_inicio DESC").
		Find(&list).Error
	return list, err
}

func (r *diaSinFormacionFichaRepository) ExistsEnFecha(fichaID uint, fecha time.Time) (bool, string, error) {
	if database.GetDB() == nil || fichaID == 0 {
		return false, "", nil
	}
	f := time.Date(fecha.Year(), fecha.Month(), fecha.Day(), 0, 0, 0, 0, fecha.Location())
	var row models.DiaSinFormacionFicha
	err := database.GetDB().
		Where("ficha_id = ? AND fecha_inicio <= ? AND fecha_fin >= ?", fichaID, f, f).
		Order("id DESC").
		First(&row).Error
	if err != nil {
		return false, "", nil
	}
	return true, row.Motivo, nil
}

func (r *diaSinFormacionFichaRepository) FindEnRango(fichaID uint, desde, hasta time.Time) ([]models.DiaSinFormacionFicha, error) {
	var list []models.DiaSinFormacionFicha
	err := database.GetDB().
		Where("ficha_id = ? AND fecha_inicio <= ? AND fecha_fin >= ?", fichaID, hasta, desde).
		Order("fecha_inicio").
		Find(&list).Error
	return list, err
}
