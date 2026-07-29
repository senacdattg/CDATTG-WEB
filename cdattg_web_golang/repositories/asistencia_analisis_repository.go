package repositories

import (
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/database"
	"gorm.io/gorm"
)

// SesionDetalleRow sesión de asistencia con fecha, primera hora de ingreso y última de salida.
type SesionDetalleRow struct {
	AsistenciaID   uint       `gorm:"column:asistencia_id"`
	FichaID        uint       `gorm:"column:ficha_id"`
	FichaNumero    string     `gorm:"column:ficha_numero"`
	ProgramaNombre string     `gorm:"column:programa_nombre"`
	JornadaNombre  string     `gorm:"column:jornada_nombre"`
	FichaActiva    bool       `gorm:"column:ficha_activa"`
	Fecha          time.Time  `gorm:"column:fecha"`
	PrimeraHora    *time.Time `gorm:"column:primera_hora"`
	UltimaHora     *time.Time `gorm:"column:ultima_hora"`
}

// AprendizRegistroRow registro de ingreso/salida de un aprendiz en una sesión.
type AprendizRegistroRow struct {
	AprendizID      uint       `gorm:"column:aprendiz_id"`
	NumeroDocumento string     `gorm:"column:numero_documento"`
	PrimerNombre    string     `gorm:"column:primer_nombre"`
	SegundoNombre   string     `gorm:"column:segundo_nombre"`
	PrimerApellido  string     `gorm:"column:primer_apellido"`
	SegundoApellido string     `gorm:"column:segundo_apellido"`
	AsistenciaID    uint       `gorm:"column:asistencia_id"`
	Fecha           time.Time  `gorm:"column:fecha"`
	HoraIngreso     *time.Time `gorm:"column:hora_ingreso"`
	HoraSalida      *time.Time `gorm:"column:hora_salida"`
}

type AsistenciaAnalisisRepository interface {
	FindSesionesDetalle(desde, hasta time.Time, sedeIDs []uint, fichaIDs []uint, aprendizID *uint, jornada, estadoFicha string) ([]SesionDetalleRow, error)
	FindFechasConSesionPorFicha(fichaID uint, desde, hasta time.Time) (map[string]struct{}, error)
	CountAprendicesAsistieronEnSesiones(asistenciaIDs []uint, aprendizID *uint) (int, error)
	FindAsistenciaIDsEnRango(desde, hasta time.Time, sedeIDs []uint, jornada string, soloFichasActivas bool) ([]uint, error)
	FindRegistrosAprendizPorFicha(fichaID uint, desde, hasta time.Time, busqueda string, aprendizID *uint) ([]AprendizRegistroRow, error)
	FindFichasExplorar(qText string, sedeIDs []uint, limit int) ([]FichaExplorarRow, error)
	FindAprendicesResumenPorFicha(fichaID uint, desde, hasta time.Time, busqueda string) ([]AprendizResumenRow, error)
}

type asistenciaAnalisisRepository struct {
	db *gorm.DB
}

func NewAsistenciaAnalisisRepository() AsistenciaAnalisisRepository {
	return &asistenciaAnalisisRepository{db: database.GetDB()}
}

func (r *asistenciaAnalisisRepository) baseJoin(q *gorm.DB) *gorm.DB {
	return q.Table("asistencias a").
		Joins("INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id").
		Joins("INNER JOIN fichas_caracterizacion fc ON ifc.ficha_id = fc.id AND fc.deleted_at IS NULL").
		Joins("LEFT JOIN jornadas j ON fc.jornada_id = j.id").
		Joins("LEFT JOIN programas_formacion pf ON fc.programa_formacion_id = pf.id")
}

func (r *asistenciaAnalisisRepository) applySedeFilter(q *gorm.DB, sedeIDs []uint) *gorm.DB {
	if len(sedeIDs) == 0 {
		return q
	}
	return q.Where("fc.sede_id IN ?", sedeIDs)
}

func (r *asistenciaAnalisisRepository) applyEstadoFichaFilter(q *gorm.DB, estadoFicha string) *gorm.DB {
	switch strings.ToLower(strings.TrimSpace(estadoFicha)) {
	case "inactivas":
		return q.Where("fc.status = ?", false)
	case "todas":
		return q
	default:
		return q.Where("fc.status = ?", true)
	}
}

func (r *asistenciaAnalisisRepository) applyActivasFilter(q *gorm.DB, soloActivas bool, ref time.Time) *gorm.DB {
	if !soloActivas {
		return q
	}
	refStr := ref.Format(time.DateOnly)
	return q.Where("fc.status = ? AND (fc.fecha_fin IS NULL OR fc.fecha_fin >= ?)", true, refStr)
}

func (r *asistenciaAnalisisRepository) FindSesionesDetalle(
	desde, hasta time.Time,
	sedeIDs []uint,
	fichaIDs []uint,
	aprendizID *uint,
	jornada, estadoFicha string,
) ([]SesionDetalleRow, error) {
	q := r.baseJoin(r.db).
		Select(`
			a.id AS asistencia_id,
			fc.id AS ficha_id,
			fc.ficha AS ficha_numero,
			COALESCE(pf.nombre, '') AS programa_nombre,
			COALESCE(j.nombre, '') AS jornada_nombre,
			fc.status AS ficha_activa,
			a.fecha AS fecha,
			COALESCE(
				(SELECT MIN(aa.hora_ingreso) FROM asistencia_aprendices aa
				 WHERE aa.asistencia_id = a.id AND aa.deleted_at IS NULL AND aa.hora_ingreso IS NOT NULL),
				a.hora_inicio,
				a.created_at
			) AS primera_hora,
			COALESCE(
				(SELECT MAX(aa.hora_salida) FROM asistencia_aprendices aa
				 WHERE aa.asistencia_id = a.id AND aa.deleted_at IS NULL AND aa.hora_salida IS NOT NULL),
				a.hora_fin
			) AS ultima_hora`).
		Where("a.deleted_at IS NULL AND a.fecha >= ? AND a.fecha < ?", desde, hasta)
	q = r.applySedeFilter(q, sedeIDs)
	q = r.applyEstadoFichaFilter(q, estadoFicha)
	if len(fichaIDs) == 1 {
		q = q.Where("fc.id = ?", fichaIDs[0])
	} else if len(fichaIDs) > 1 {
		q = q.Where("fc.id IN ?", fichaIDs)
	}
	if jornada != "" {
		q = q.Where("j.nombre = ?", jornada)
	}
	if aprendizID != nil && *aprendizID > 0 {
		q = q.Where(`EXISTS (
			SELECT 1 FROM asistencia_aprendices aa2
			INNER JOIN aprendices ap ON ap.id = aa2.aprendiz_ficha_id AND ap.deleted_at IS NULL
			WHERE aa2.asistencia_id = a.id AND aa2.deleted_at IS NULL AND ap.id = ?
		)`, *aprendizID)
	}
	var rows []SesionDetalleRow
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *asistenciaAnalisisRepository) FindFechasConSesionPorFicha(fichaID uint, desde, hasta time.Time) (map[string]struct{}, error) {
	var fechas []time.Time
	err := r.baseJoin(r.db).
		Select("DISTINCT a.fecha").
		Where("a.deleted_at IS NULL AND fc.id = ? AND a.fecha >= ? AND a.fecha < ?", fichaID, desde, hasta).
		Pluck("fecha", &fechas).Error
	if err != nil {
		return nil, err
	}
	loc := fechasLoc()
	out := make(map[string]struct{}, len(fechas))
	for _, t := range fechas {
		out[t.In(loc).Format(time.DateOnly)] = struct{}{}
	}
	return out, nil
}

func fechasLoc() *time.Location {
	loc, err := time.LoadLocation("America/Bogota")
	if err != nil {
		return time.Local
	}
	return loc
}

func (r *asistenciaAnalisisRepository) CountAprendicesAsistieronEnSesiones(asistenciaIDs []uint, aprendizID *uint) (int, error) {
	if len(asistenciaIDs) == 0 {
		return 0, nil
	}
	q := r.db.Table("asistencia_aprendices aa").
		Where("aa.deleted_at IS NULL AND aa.asistencia_id IN ? AND aa.hora_ingreso IS NOT NULL", asistenciaIDs)
	if aprendizID != nil && *aprendizID > 0 {
		q = q.Where("aa.aprendiz_ficha_id = ?", *aprendizID)
	}
	var total int64
	if err := q.Distinct("aa.aprendiz_ficha_id").Count(&total).Error; err != nil {
		return 0, err
	}
	return int(total), nil
}

func (r *asistenciaAnalisisRepository) FindAsistenciaIDsEnRango(
	desde, hasta time.Time,
	sedeIDs []uint,
	jornada string,
	soloFichasActivas bool,
) ([]uint, error) {
	ref := hasta.Add(-time.Second)
	q := r.baseJoin(r.db).Select("a.id").
		Where("a.deleted_at IS NULL AND a.fecha >= ? AND a.fecha < ?", desde, hasta)
	q = r.applySedeFilter(q, sedeIDs)
	q = r.applyActivasFilter(q, soloFichasActivas, ref)
	if jornada != "" {
		q = q.Where("j.nombre = ?", jornada)
	}
	var ids []uint
	if err := q.Pluck("a.id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func (r *asistenciaAnalisisRepository) FindRegistrosAprendizPorFicha(
	fichaID uint,
	desde, hasta time.Time,
	busqueda string,
	aprendizID *uint,
) ([]AprendizRegistroRow, error) {
	q := r.db.Table("asistencia_aprendices aa").
		Select(`
			ap.id AS aprendiz_id,
			COALESCE(p.numero_documento, '') AS numero_documento,
			COALESCE(p.primer_nombre, '') AS primer_nombre,
			COALESCE(p.segundo_nombre, '') AS segundo_nombre,
			COALESCE(p.primer_apellido, '') AS primer_apellido,
			COALESCE(p.segundo_apellido, '') AS segundo_apellido,
			a.id AS asistencia_id,
			a.fecha AS fecha,
			aa.hora_ingreso AS hora_ingreso,
			aa.hora_salida AS hora_salida`).
		Joins("INNER JOIN asistencias a ON a.id = aa.asistencia_id AND a.deleted_at IS NULL").
		Joins("INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id").
		Joins("INNER JOIN aprendices ap ON ap.id = aa.aprendiz_ficha_id AND ap.deleted_at IS NULL").
		Joins("INNER JOIN personas p ON p.id = ap.persona_id AND p.deleted_at IS NULL").
		Where("aa.deleted_at IS NULL AND ifc.ficha_id = ? AND a.fecha >= ? AND a.fecha < ?", fichaID, desde, hasta).
		Where("aa.hora_ingreso IS NOT NULL OR aa.hora_salida IS NOT NULL")

	if aprendizID != nil && *aprendizID > 0 {
		q = q.Where("ap.id = ?", *aprendizID)
	} else if qText := strings.TrimSpace(busqueda); qText != "" {
		pattern := "%" + strings.ToLower(strings.Join(strings.Fields(qText), "%")) + "%"
		q = q.Where(`
			LOWER(p.numero_documento) LIKE ? OR
			LOWER(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido)) LIKE ?`,
			pattern, pattern)
	}

	q = q.Order("p.primer_apellido ASC, p.primer_nombre ASC, a.fecha DESC, aa.hora_ingreso ASC")

	var rows []AprendizRegistroRow
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// FichaExplorarRow fila para tarjetas de exploración del panel analítico.
type FichaExplorarRow struct {
	FichaID               uint   `gorm:"column:ficha_id"`
	FichaNumero           string `gorm:"column:ficha_numero"`
	ProgramaNombre        string `gorm:"column:programa_nombre"`
	SedeNombre            string `gorm:"column:sede_nombre"`
	JornadaNombre         string `gorm:"column:jornada_nombre"`
	ModalidadNombre       string `gorm:"column:modalidad_nombre"`
	InstructorNombre      string `gorm:"column:instructor_nombre"`
	AmbienteNombre        string `gorm:"column:ambiente_nombre"`
	CantidadAprendices    int    `gorm:"column:cantidad_aprendices"`
	Status                bool   `gorm:"column:status"`
	CoincidenciasAprendiz int    `gorm:"column:coincidencias_aprendiz"`
}

// AprendizResumenRow resumen de aprendiz con conteo de registros en rango.
type AprendizResumenRow struct {
	AprendizID      uint   `gorm:"column:aprendiz_id"`
	NumeroDocumento string `gorm:"column:numero_documento"`
	PrimerNombre    string `gorm:"column:primer_nombre"`
	SegundoNombre   string `gorm:"column:segundo_nombre"`
	PrimerApellido  string `gorm:"column:primer_apellido"`
	SegundoApellido string `gorm:"column:segundo_apellido"`
	TotalRegistros  int    `gorm:"column:total_registros"`
}

func (r *asistenciaAnalisisRepository) FindFichasExplorar(qText string, sedeIDs []uint, limit int) ([]FichaExplorarRow, error) {
	norm := strings.TrimSpace(qText)
	if norm == "" {
		return nil, nil
	}
	if limit <= 0 || limit > 60 {
		limit = 60
	}
	pattern := "%" + strings.ToLower(strings.Join(strings.Fields(norm), "%")) + "%"

	q := r.db.Table("fichas_caracterizacion fc").
		Select(`
			fc.id AS ficha_id,
			fc.ficha AS ficha_numero,
			COALESCE(pf.nombre, '') AS programa_nombre,
			COALESCE(s.nombre, '') AS sede_nombre,
			COALESCE(j.nombre, '') AS jornada_nombre,
			COALESCE(mf.nombre, '') AS modalidad_nombre,
			COALESCE(TRIM(CONCAT_WS(' ', pi.primer_nombre, pi.primer_apellido)), '') AS instructor_nombre,
			COALESCE(amb.nombre, '') AS ambiente_nombre,
			(SELECT COUNT(*)::int FROM aprendices apc
			 WHERE apc.ficha_caracterizacion_id = fc.id AND apc.deleted_at IS NULL AND apc.estado = true) AS cantidad_aprendices,
			fc.status AS status,
			(SELECT COUNT(*)::int FROM aprendices apm
			 INNER JOIN personas pm ON pm.id = apm.persona_id AND pm.deleted_at IS NULL
			 WHERE apm.ficha_caracterizacion_id = fc.id AND apm.deleted_at IS NULL
			   AND (
			     LOWER(pm.numero_documento) LIKE ? OR
			     LOWER(CONCAT_WS(' ', pm.primer_nombre, pm.segundo_nombre, pm.primer_apellido, pm.segundo_apellido)) LIKE ?
			   )
			) AS coincidencias_aprendiz`, pattern, pattern).
		Joins("LEFT JOIN programas_formacion pf ON pf.id = fc.programa_formacion_id").
		Joins("LEFT JOIN sedes s ON s.id = fc.sede_id").
		Joins("LEFT JOIN jornadas j ON j.id = fc.jornada_id").
		Joins("LEFT JOIN modalidades_formacion mf ON mf.id = fc.modalidad_formacion_id").
		Joins("LEFT JOIN instructors i ON i.id = fc.instructor_id").
		Joins("LEFT JOIN personas pi ON pi.id = i.persona_id").
		Joins("LEFT JOIN ambientes amb ON amb.id = fc.ambiente_id").
		Where("fc.deleted_at IS NULL").
		Where(`
			LOWER(fc.ficha) LIKE ? OR
			LOWER(COALESCE(pf.nombre, '')) LIKE ? OR
			EXISTS (
			  SELECT 1 FROM aprendices apx
			  INNER JOIN personas px ON px.id = apx.persona_id AND px.deleted_at IS NULL
			  WHERE apx.ficha_caracterizacion_id = fc.id AND apx.deleted_at IS NULL
			    AND (
			      LOWER(px.numero_documento) LIKE ? OR
			      LOWER(CONCAT_WS(' ', px.primer_nombre, px.segundo_nombre, px.primer_apellido, px.segundo_apellido)) LIKE ?
			    )
			)`, pattern, pattern, pattern, pattern)

	if len(sedeIDs) > 0 {
		q = q.Where("fc.sede_id IN ?", sedeIDs)
	}
	q = q.Order("fc.ficha ASC").Limit(limit)

	var rows []FichaExplorarRow
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *asistenciaAnalisisRepository) FindAprendicesResumenPorFicha(
	fichaID uint,
	desde, hasta time.Time,
	busqueda string,
) ([]AprendizResumenRow, error) {
	q := r.db.Table("aprendices ap").
		Select(`
			ap.id AS aprendiz_id,
			COALESCE(p.numero_documento, '') AS numero_documento,
			COALESCE(p.primer_nombre, '') AS primer_nombre,
			COALESCE(p.segundo_nombre, '') AS segundo_nombre,
			COALESCE(p.primer_apellido, '') AS primer_apellido,
			COALESCE(p.segundo_apellido, '') AS segundo_apellido,
			(
			  SELECT COUNT(*)::int FROM asistencia_aprendices aa
			  INNER JOIN asistencias a ON a.id = aa.asistencia_id AND a.deleted_at IS NULL
			  INNER JOIN instructor_fichas_caracterizacion ifc ON a.instructor_ficha_id = ifc.id
			  WHERE aa.deleted_at IS NULL AND aa.aprendiz_ficha_id = ap.id
			    AND ifc.ficha_id = ?
			    AND a.fecha >= ? AND a.fecha < ?
			    AND (aa.hora_ingreso IS NOT NULL OR aa.hora_salida IS NOT NULL)
			) AS total_registros`, fichaID, desde, hasta).
		Joins("INNER JOIN personas p ON p.id = ap.persona_id AND p.deleted_at IS NULL").
		Where("ap.deleted_at IS NULL AND ap.ficha_caracterizacion_id = ?", fichaID)

	if qText := strings.TrimSpace(busqueda); qText != "" {
		pattern := "%" + strings.ToLower(strings.Join(strings.Fields(qText), "%")) + "%"
		q = q.Where(`
			LOWER(p.numero_documento) LIKE ? OR
			LOWER(CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido)) LIKE ?`,
			pattern, pattern)
	}

	q = q.Order("p.primer_apellido ASC, p.primer_nombre ASC")

	var rows []AprendizResumenRow
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
