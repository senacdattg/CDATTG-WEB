package services

import (
	"errors"
	"mime/multipart"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// LmsAulaService aulas LMS (listado, detalle, publicar y editar actividad).
type LmsAulaService interface {
	ListAulas(userID uint) ([]dto.LmsAulaListItem, error)
	GetAula(userID, fichaID uint) (*dto.LmsAulaDetalle, error)
	CreateActividad(userID, fichaID uint, req dto.LmsActividadRequest, files []*multipart.FileHeader) (*dto.LmsActividadItem, error)
	UpdateActividad(userID, fichaID, actividadID uint, req dto.LmsActividadRequest, files []*multipart.FileHeader) (*dto.LmsActividadItem, error)
	DeleteActividad(userID, fichaID, actividadID uint) error
	DescargarArchivo(userID, fichaID, actividadID, archivoID uint) (*models.LmsActividadArchivo, error)
	GetActividad(userID, fichaID, actividadID uint) (*dto.LmsActividadDetalle, error)
	Entregar(userID, fichaID, actividadID uint, files []*multipart.FileHeader) (*dto.LmsEntregaItem, error)
	DeshacerEntrega(userID, fichaID, actividadID uint) (*dto.LmsEntregaItem, error)
	Calificar(userID, fichaID, actividadID, entregaID uint, req dto.LmsNotaRequest) (*dto.LmsEntregaItem, error)
	DescargarArchivoEntrega(userID, fichaID, actividadID, entregaID, archivoID uint) (*models.LmsEntregaArchivo, error)
	HistorialCalificaciones(userID, fichaID uint) ([]dto.LmsHistorialFila, error)
}

type lmsAulaService struct {
	users       repositories.UserRepository
	fichas      repositories.FichaRepository
	aprendices  repositories.AprendizRepository
	actividades repositories.LmsActividadRepository
	entregas    repositories.LmsEntregaRepository
	acceso      *lmsAcceso
}

// NewLmsAulaService constructor.
func NewLmsAulaService() LmsAulaService {
	return &lmsAulaService{
		users:       repositories.NewUserRepository(),
		fichas:      repositories.NewFichaRepository(),
		aprendices:  repositories.NewAprendizRepository(),
		actividades: repositories.NewLmsActividadRepository(),
		entregas:    repositories.NewLmsEntregaRepository(),
		acceso:      newLmsAcceso(),
	}
}

func (s *lmsAulaService) ListAulas(userID uint) ([]dto.LmsAulaListItem, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	fichas, err := s.fichasDeUsuario(user, roles)
	if err != nil {
		return nil, err
	}
	ids := make([]uint, len(fichas))
	for i := range fichas {
		ids[i] = fichas[i].ID
	}
	conteos, _ := s.aprendices.CountActivosByFichaIDs(ids)
	out := make([]dto.LmsAulaListItem, 0, len(fichas))
	for i := range fichas {
		out = append(out, mapFichaAAulaItem(fichas[i], conteos[fichas[i].ID], s.acceso.puedePublicar(user, fichas[i].ID, roles)))
	}
	return out, nil
}

func (s *lmsAulaService) GetAula(userID, fichaID uint) (*dto.LmsAulaDetalle, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirEntrar(user, fichaID, roles); err != nil {
		return nil, err
	}
	ficha, err := s.fichas.FindByID(fichaID)
	if err != nil {
		return nil, errors.New("ficha no encontrada")
	}
	puede := s.acceso.puedePublicar(user, fichaID, roles)
	aps, _ := s.aprendices.FindByFichaID(fichaID)
	if !puede {
		aps = aprendicesActivosAula(aps)
	}
	acts, _ := s.actividades.FindByFichaID(fichaID)
	acts = filtrarActividadesDelInstructor(acts, user.ID, puede)
	items := mapActividadesAula(acts, s.nombresCreadores(acts))
	marcarActividadesEntregadas(items, s.idsEntregadasDeAprendiz(user, fichaID, acts))
	marcarCantidadEntregas(items, s.conteoEntregasAula(acts))
	item := mapFichaAAulaItem(*ficha, len(aps), puede)
	det := &dto.LmsAulaDetalle{
		FichaID:        item.FichaID,
		NumeroFicha:    item.NumeroFicha,
		NombrePrograma: item.NombrePrograma,
		TipoFormacion:  item.TipoFormacion,
		PuedePublicar:     item.PuedePublicar,
		PuedeVerHistorial: puede,
		PuedeEntregar:     lmsAprendizPuedeEntregar(s.aprendizDeUsuario(user, fichaID)),
		Aprendices:     mapAprendicesAula(aps),
		Actividades:    items,
	}
	return det, nil
}

func (s *lmsAulaService) usuarioYRoles(userID uint) (*models.User, []string, error) {
	user, err := s.users.FindByID(userID)
	if err != nil {
		return nil, nil, errors.New("usuario no encontrado")
	}
	return user, lmsUserRoles(userID), nil
}
