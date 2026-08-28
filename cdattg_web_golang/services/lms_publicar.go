package services

import (
	"errors"
	"mime/multipart"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

var errTituloObligatorio = errors.New("el título es obligatorio")
var errPlazoObligatorio = errors.New("el plazo de entrega es obligatorio")
var errPlazoInvalido = errors.New("plazo de entrega inválido")

// CreateActividad publica en el tablón (título, descripción, plazo y archivos).
func (s *lmsAulaService) CreateActividad(
	userID, fichaID uint,
	req dto.LmsActividadRequest,
	files []*multipart.FileHeader,
) (*dto.LmsActividadItem, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirPublicar(user, fichaID, roles); err != nil {
		return nil, err
	}
	titulo := strings.TrimSpace(req.Titulo)
	if titulo == "" {
		return nil, errTituloObligatorio
	}
	puntos, errPuntos := PuntosActividadLMS(req.CalificacionMax)
	if errPuntos != nil {
		return nil, errPuntos
	}
	if err := exigirPlazoLMS(req.PlazoEntrega); err != nil {
		return nil, err
	}
	uid := userID
	row := &models.LmsActividad{
		FichaID:         fichaID,
		Tipo:            models.LmsActividadTablon,
		Titulo:          titulo,
		Cuerpo:          strings.TrimSpace(req.Cuerpo),
		HabilitaCarga:   true,
		CalificacionMax: puntos,
		PlazoEntrega:    req.PlazoEntrega,
	}
	row.UserCreateID = &uid
	if err := s.actividades.Create(row); err != nil {
		return nil, err
	}
	if err := guardarArchivosActividad(s.actividades, userID, fichaID, row.ID, files); err != nil {
		return nil, err
	}
	return s.itemDeActividad(fichaID, *row), nil
}

// itemDeActividad recarga la publicación con adjuntos y nombre del instructor.
func (s *lmsAulaService) itemDeActividad(fichaID uint, row models.LmsActividad) *dto.LmsActividadItem {
	acts, findErr := s.actividades.FindByFichaID(fichaID)
	nombres := s.nombresCreadores(acts)
	if findErr == nil {
		for i := range acts {
			if acts[i].ID == row.ID {
				item := mapActividadAula(acts[i], nombres)
				return &item
			}
		}
	}
	item := mapActividadAula(row, nombres)
	return &item
}

// exigirPlazoLMS rechaza publicaciones sin fecha y hora de entrega.
func exigirPlazoLMS(plazo *time.Time) error {
	if plazo == nil {
		return errPlazoObligatorio
	}
	return nil
}

// ParsePlazoEntregaLMS interpreta datetime-local o RFC3339. Vacío no es válido.
func ParsePlazoEntregaLMS(raw string) (*time.Time, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return nil, errPlazoObligatorio
	}
	layouts := []string{time.RFC3339, "2006-01-02T15:04", "2006-01-02T15:04:05"}
	for _, layout := range layouts {
		if t, err := time.ParseInLocation(layout, s, time.Local); err == nil {
			return &t, nil
		}
	}
	return nil, errPlazoInvalido
}
