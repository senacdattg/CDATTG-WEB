package repositories

import (
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// LmsActividadRepository CRUD de publicaciones del aula.
type LmsActividadRepository interface {
	FindByFichaID(fichaID uint) ([]models.LmsActividad, error)
	FindByID(id uint) (*models.LmsActividad, error)
	Create(row *models.LmsActividad) error
	Update(row *models.LmsActividad) error
	CreateArchivo(row *models.LmsActividadArchivo) error
	FindArchivo(fichaID, actividadID, archivoID uint) (*models.LmsActividadArchivo, error)
	DeleteConRelaciones(actividadID uint) error
}

type lmsActividadRepository struct {
	db *gorm.DB
}

// NewLmsActividadRepository constructor.
func NewLmsActividadRepository() LmsActividadRepository {
	return &lmsActividadRepository{db: database.GetDB()}
}

// FindByFichaID lista publicaciones con adjuntos, más recientes primero.
func (r *lmsActividadRepository) FindByFichaID(fichaID uint) ([]models.LmsActividad, error) {
	var list []models.LmsActividad
	err := r.db.Preload("Archivos").Where("ficha_id = ?", fichaID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *lmsActividadRepository) FindByID(id uint) (*models.LmsActividad, error) {
	var row models.LmsActividad
	err := r.db.Preload("Archivos").First(&row, id).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

// Create persiste una publicación.
func (r *lmsActividadRepository) Create(row *models.LmsActividad) error {
	return r.db.Create(row).Error
}

// Update guarda título, cuerpo, puntos, plazo y auditoría (incluye plazo nulo).
func (r *lmsActividadRepository) Update(row *models.LmsActividad) error {
	return r.db.Model(row).Select(
		"titulo", "cuerpo", "calificacion_max", "plazo_entrega", "user_edit_id",
	).Updates(row).Error
}

// CreateArchivo persiste un adjunto.
func (r *lmsActividadRepository) CreateArchivo(row *models.LmsActividadArchivo) error {
	return r.db.Create(row).Error
}

// FindArchivo localiza un adjunto de una actividad de la ficha.
func (r *lmsActividadRepository) FindArchivo(fichaID, actividadID, archivoID uint) (*models.LmsActividadArchivo, error) {
	var row models.LmsActividadArchivo
	err := r.db.Joins("JOIN lms_actividades a ON a.id = lms_actividad_archivos.actividad_id").
		Where("lms_actividad_archivos.id = ? AND lms_actividad_archivos.actividad_id = ? AND a.ficha_id = ?",
			archivoID, actividadID, fichaID).
		First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}
