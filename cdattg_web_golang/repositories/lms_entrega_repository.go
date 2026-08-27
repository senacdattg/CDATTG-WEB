package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// LmsEntregaRepository envíos de aprendices.
type LmsEntregaRepository interface {
	FindByActividadID(actividadID uint) ([]models.LmsEntrega, error)
	FindByActividadYAprendiz(actividadID, aprendizID uint) (*models.LmsEntrega, error)
	Create(row *models.LmsEntrega) error
	Save(row *models.LmsEntrega) error
	CreateArchivo(row *models.LmsEntregaArchivo) error
	FindArchivo(fichaID, actividadID, entregaID, archivoID uint) (*models.LmsEntregaArchivo, error)
}

type lmsEntregaRepository struct {
	db *gorm.DB
}

// NewLmsEntregaRepository constructor.
func NewLmsEntregaRepository() LmsEntregaRepository {
	return &lmsEntregaRepository{db: database.GetDB()}
}

func (r *lmsEntregaRepository) FindByActividadID(actividadID uint) ([]models.LmsEntrega, error) {
	var list []models.LmsEntrega
	err := r.db.Preload("Archivos").Preload("Aprendiz.Persona").
		Where("actividad_id = ?", actividadID).Find(&list).Error
	return list, err
}

func (r *lmsEntregaRepository) FindByActividadYAprendiz(actividadID, aprendizID uint) (*models.LmsEntrega, error) {
	var row models.LmsEntrega
	err := r.db.Preload("Archivos").Where("actividad_id = ? AND aprendiz_id = ?", actividadID, aprendizID).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *lmsEntregaRepository) Create(row *models.LmsEntrega) error {
	return r.db.Create(row).Error
}

func (r *lmsEntregaRepository) Save(row *models.LmsEntrega) error {
	return r.db.Save(row).Error
}

func (r *lmsEntregaRepository) CreateArchivo(row *models.LmsEntregaArchivo) error {
	return r.db.Create(row).Error
}

func (r *lmsEntregaRepository) FindArchivo(fichaID, actividadID, entregaID, archivoID uint) (*models.LmsEntregaArchivo, error) {
	var row models.LmsEntregaArchivo
	err := r.db.Joins("JOIN lms_entregas e ON e.id = lms_entrega_archivos.entrega_id").
		Joins("JOIN lms_actividades a ON a.id = e.actividad_id").
		Where("lms_entrega_archivos.id = ? AND e.id = ? AND e.actividad_id = ? AND a.ficha_id = ?",
			archivoID, entregaID, actividadID, fichaID).
		First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}
