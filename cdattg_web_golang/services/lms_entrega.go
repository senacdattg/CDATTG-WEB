package services

import (
	"errors"
	"mime/multipart"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
)

func (s *lmsAulaService) GetActividad(userID, fichaID, actividadID uint) (*dto.LmsActividadDetalle, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirEntrar(user, fichaID, roles); err != nil {
		return nil, err
	}
	act, err := s.actividadVisibleEnFicha(user, fichaID, actividadID, roles)
	if err != nil {
		return nil, err
	}
	puede := s.acceso.puedePublicar(user, fichaID, roles)
	verHist := s.acceso.puedeVerHistorial(user, fichaID, roles)
	nombres := s.nombresCreadores([]models.LmsActividad{*act})
	det := &dto.LmsActividadDetalle{
		LmsActividadItem:  mapActividadAula(*act, nombres),
		PuedePublicar:     puede,
		PuedeVerHistorial: verHist,
		Entregas:          []dto.LmsEntregaItem{},
	}
	if verHist {
		det.Entregas = s.listarEntregasInstructor(fichaID, act)
		return det, nil
	}
	if ap := s.aprendizDeUsuario(user, fichaID); ap != nil {
		det.PuedeEntregar = lmsAprendizPuedeEntregar(ap)
		if row, e := s.entregas.FindByActividadYAprendiz(actividadID, ap.ID); e == nil {
			item := mapEntregaItem(*row, ap, act.PlazoEntrega)
			det.MiEntrega = &item
		}
	}
	return det, nil
}

func (s *lmsAulaService) Entregar(userID, fichaID, actividadID uint, files []*multipart.FileHeader) (*dto.LmsEntregaItem, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if err := s.acceso.exigirEntrar(user, fichaID, roles); err != nil {
		return nil, err
	}
	ap := s.aprendizDeUsuario(user, fichaID)
	if ap == nil {
		return nil, errors.New("solo el aprendiz puede entregar")
	}
	if err := exigirEntregaAprendiz(ap); err != nil {
		return nil, err
	}
	act, err := s.actividadDeFicha(fichaID, actividadID)
	if err != nil {
		return nil, err
	}
	row, err := s.obtenerOCrearEntrega(userID, actividadID, ap.ID)
	if err != nil {
		return nil, err
	}
	if len(files) > 0 {
		if err := guardarArchivosEntrega(s.entregas, userID, fichaID, actividadID, ap.ID, row.ID, files); err != nil {
			return nil, err
		}
	}
	fresh, err := s.entregas.FindByActividadYAprendiz(actividadID, ap.ID)
	if err != nil {
		return nil, err
	}
	if len(fresh.Archivos) == 0 {
		return nil, errEntregaSinArchivo
	}
	fresh.EntregadoEn = time.Now()
	uid := userID
	fresh.UserEditID = &uid
	if err := s.entregas.Save(fresh); err != nil {
		return nil, err
	}
	item := mapEntregaItem(*fresh, ap, act.PlazoEntrega)
	return &item, nil
}

func (s *lmsAulaService) obtenerOCrearEntrega(userID, actividadID, aprendizID uint) (*models.LmsEntrega, error) {
	row, err := s.entregas.FindByActividadYAprendiz(actividadID, aprendizID)
	if err == nil {
		return row, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	uid := userID
	nuevo := &models.LmsEntrega{ActividadID: actividadID, AprendizID: aprendizID}
	nuevo.UserCreateID = &uid
	if err := s.entregas.Create(nuevo); err != nil {
		return nil, err
	}
	return nuevo, nil
}

func (s *lmsAulaService) actividadDeFicha(fichaID, actividadID uint) (*models.LmsActividad, error) {
	act, err := s.actividades.FindByID(actividadID)
	if err != nil {
		return nil, errors.New("actividad no encontrada")
	}
	if act.FichaID != fichaID {
		return nil, errors.New("actividad no encontrada")
	}
	return act, nil
}

func (s *lmsAulaService) aprendizDeUsuario(user *models.User, fichaID uint) *models.Aprendiz {
	if user.PersonaID == nil {
		return nil
	}
	ap, err := s.aprendices.FindByPersonaIDAndFichaID(*user.PersonaID, fichaID)
	if err != nil {
		return nil
	}
	return ap
}
