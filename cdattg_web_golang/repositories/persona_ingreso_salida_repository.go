package repositories

import (
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

// AccesoHistorialQuery filtros de listado / stats.
type AccesoHistorialQuery struct {
	RegionalID       *uint
	SedeID           *uint
	FechaDesde       *time.Time
	FechaHasta       *time.Time
	TipoPersona      string
	Documento        string
	Estado           string // abierto | cerrado | todos
	SalidaSinIngreso *bool
	Page             int
	PageSize         int
}

// PersonaIngresoSalidaRepository acceso a registros de portería.
type PersonaIngresoSalidaRepository interface {
	FindAbiertaByPersonaAndSede(personaID, sedeID uint) (*models.PersonaIngresoSalida, error)
	Create(row *models.PersonaIngresoSalida) error
	Update(row *models.PersonaIngresoSalida) error
	ListAbiertasBySede(sedeID uint) ([]models.PersonaIngresoSalida, error)
	CountAbiertasBySede(sedeID *uint, regionalID *uint) (int64, error)
	ListHistorial(q AccesoHistorialQuery) ([]models.PersonaIngresoSalida, int64, error)
	StatsHistorial(q AccesoHistorialQuery) (totalIngresos, totalSalidas, abiertas, cerradas, sinIngreso int64, porTipo, porMotivo, porMetodo map[string]int64, err error)
}

type personaIngresoSalidaRepository struct {
	db *gorm.DB
}

// NewPersonaIngresoSalidaRepository crea el repositorio.
func NewPersonaIngresoSalidaRepository() PersonaIngresoSalidaRepository {
	return &personaIngresoSalidaRepository{db: database.GetDB()}
}

func (r *personaIngresoSalidaRepository) FindAbiertaByPersonaAndSede(personaID, sedeID uint) (*models.PersonaIngresoSalida, error) {
	var row models.PersonaIngresoSalida
	err := r.db.
		Where("persona_id = ? AND sede_id = ? AND timestamp_salida IS NULL", personaID, sedeID).
		Order("timestamp_entrada DESC").
		First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *personaIngresoSalidaRepository) Create(row *models.PersonaIngresoSalida) error {
	return r.db.Create(row).Error
}

func (r *personaIngresoSalidaRepository) Update(row *models.PersonaIngresoSalida) error {
	return r.db.Save(row).Error
}

func (r *personaIngresoSalidaRepository) ListAbiertasBySede(sedeID uint) ([]models.PersonaIngresoSalida, error) {
	var rows []models.PersonaIngresoSalida
	err := r.db.
		Preload("Persona").
		Where("sede_id = ? AND timestamp_salida IS NULL", sedeID).
		Order("timestamp_entrada DESC").
		Find(&rows).Error
	return rows, err
}

func (r *personaIngresoSalidaRepository) baseQuery(q AccesoHistorialQuery) *gorm.DB {
	tx := r.db.Model(&models.PersonaIngresoSalida{}).
		Joins("LEFT JOIN sedes ON sedes.id = persona_ingreso_salida.sede_id")

	if q.SedeID != nil && *q.SedeID > 0 {
		tx = tx.Where("persona_ingreso_salida.sede_id = ?", *q.SedeID)
	} else if q.RegionalID != nil && *q.RegionalID > 0 {
		tx = tx.Where("sedes.regional_id = ?", *q.RegionalID)
	}
	if q.FechaDesde != nil {
		tx = tx.Where("persona_ingreso_salida.timestamp_entrada >= ?", *q.FechaDesde)
	}
	if q.FechaHasta != nil {
		tx = tx.Where("persona_ingreso_salida.timestamp_entrada < ?", q.FechaHasta.Add(24*time.Hour))
	}
	if tp := strings.TrimSpace(q.TipoPersona); tp != "" {
		tx = tx.Where("persona_ingreso_salida.tipo_persona = ?", strings.ToUpper(tp))
	}
	if doc := strings.TrimSpace(q.Documento); doc != "" {
		tx = tx.Joins("LEFT JOIN personas ON personas.id = persona_ingreso_salida.persona_id").
			Where("personas.numero_documento LIKE ?", "%"+doc+"%")
	}
	switch strings.ToLower(strings.TrimSpace(q.Estado)) {
	case "abierto":
		tx = tx.Where("persona_ingreso_salida.timestamp_salida IS NULL")
	case "cerrado":
		tx = tx.Where("persona_ingreso_salida.timestamp_salida IS NOT NULL")
	}
	if q.SalidaSinIngreso != nil {
		tx = tx.Where("persona_ingreso_salida.salida_sin_ingreso = ?", *q.SalidaSinIngreso)
	}
	return tx
}

func (r *personaIngresoSalidaRepository) CountAbiertasBySede(sedeID *uint, regionalID *uint) (int64, error) {
	q := AccesoHistorialQuery{SedeID: sedeID, RegionalID: regionalID, Estado: "abierto"}
	var n int64
	err := r.baseQuery(q).Count(&n).Error
	return n, err
}

func (r *personaIngresoSalidaRepository) ListHistorial(q AccesoHistorialQuery) ([]models.PersonaIngresoSalida, int64, error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	size := q.PageSize
	if size < 1 {
		size = 25
	}
	if size > 200 {
		size = 200
	}

	var total int64
	if err := r.baseQuery(q).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []models.PersonaIngresoSalida
	err := r.baseQuery(q).
		Select("persona_ingreso_salida.*").
		Preload("Persona").
		Preload("Sede").
		Preload("Sede.Regional").
		Order("persona_ingreso_salida.timestamp_entrada DESC").
		Offset((page - 1) * size).
		Limit(size).
		Find(&rows).Error
	return rows, total, err
}

func (r *personaIngresoSalidaRepository) StatsHistorial(q AccesoHistorialQuery) (
	totalIngresos, totalSalidas, abiertas, cerradas, sinIngreso int64,
	porTipo, porMotivo, porMetodo map[string]int64,
	err error,
) {
	porTipo = map[string]int64{}
	porMotivo = map[string]int64{}
	porMetodo = map[string]int64{}

	base := r.baseQuery(q)
	if err = base.Count(&totalIngresos).Error; err != nil {
		return
	}

	qCerrado := q
	qCerrado.Estado = "cerrado"
	if err = r.baseQuery(qCerrado).Count(&totalSalidas).Error; err != nil {
		return
	}
	cerradas = totalSalidas

	qAbierto := q
	qAbierto.Estado = "abierto"
	if err = r.baseQuery(qAbierto).Count(&abiertas).Error; err != nil {
		return
	}

	flag := true
	qSin := q
	qSin.SalidaSinIngreso = &flag
	if err = r.baseQuery(qSin).Count(&sinIngreso).Error; err != nil {
		return
	}

	type kv struct {
		K string
		N int64
	}
	var tipos []kv
	if err = r.baseQuery(q).
		Select("persona_ingreso_salida.tipo_persona as k, COUNT(*) as n").
		Group("persona_ingreso_salida.tipo_persona").
		Scan(&tipos).Error; err != nil {
		return
	}
	for _, row := range tipos {
		porTipo[row.K] = row.N
	}

	var motivos []kv
	if err = r.baseQuery(qCerrado).
		Select("persona_ingreso_salida.motivo_salida as k, COUNT(*) as n").
		Where("persona_ingreso_salida.motivo_salida <> ''").
		Group("persona_ingreso_salida.motivo_salida").
		Scan(&motivos).Error; err != nil {
		return
	}
	for _, row := range motivos {
		porMotivo[row.K] = row.N
	}

	var metodos []kv
	if err = r.baseQuery(q).
		Select("persona_ingreso_salida.metodo_registro as k, COUNT(*) as n").
		Group("persona_ingreso_salida.metodo_registro").
		Scan(&metodos).Error; err != nil {
		return
	}
	for _, row := range metodos {
		porMetodo[row.K] = row.N
	}
	return
}
