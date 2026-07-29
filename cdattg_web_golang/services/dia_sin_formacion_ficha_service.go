package services

import (
	"errors"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type DiaSinFormacionFichaService struct {
	repo      repositories.DiaSinFormacionFichaRepository
	fichaRepo repositories.FichaRepository
}

func NewDiaSinFormacionFichaService() *DiaSinFormacionFichaService {
	return &DiaSinFormacionFichaService{
		repo:      repositories.NewDiaSinFormacionFichaRepository(),
		fichaRepo: repositories.NewFichaRepository(),
	}
}

func (s *DiaSinFormacionFichaService) toItem(row *models.DiaSinFormacionFicha) dto.DiaSinFormacionFichaItem {
	item := dto.DiaSinFormacionFichaItem{
		ID:          row.ID,
		FichaID:     row.FichaID,
		FechaInicio: dto.FormatFechaDTO(row.FechaInicio),
		FechaFin:    dto.FormatFechaDTO(row.FechaFin),
		Motivo:      row.Motivo,
		CreatedAt:   row.CreatedAt.Format(time.RFC3339),
	}
	if row.Ficha != nil {
		item.FichaNumero = row.Ficha.Ficha
		if row.Ficha.ProgramaFormacion != nil {
			item.ProgramaNombre = row.Ficha.ProgramaFormacion.Nombre
		}
	}
	return item
}

func (s *DiaSinFormacionFichaService) List(fichaID *uint) ([]dto.DiaSinFormacionFichaItem, error) {
	var rows []models.DiaSinFormacionFicha
	var err error
	if fichaID != nil && *fichaID > 0 {
		rows, err = s.repo.ListByFicha(*fichaID)
	} else {
		rows, err = s.repo.ListAll()
	}
	if err != nil {
		return nil, err
	}
	out := make([]dto.DiaSinFormacionFichaItem, len(rows))
	for i := range rows {
		out[i] = s.toItem(&rows[i])
	}
	return out, nil
}

func validarRangoYMotivoFicha(req dto.DiaSinFormacionFichaCreateRequest) (inicio, fin time.Time, motivo string, err error) {
	if len(req.FichaIDs) == 0 {
		return time.Time{}, time.Time{}, "", errors.New("seleccione al menos una ficha")
	}
	inicio, err = parseFechaAdmin(req.FechaInicio)
	if err != nil {
		return time.Time{}, time.Time{}, "", errors.New("fecha_inicio inválida, use YYYY-MM-DD")
	}
	fin, err = parseFechaAdmin(req.FechaFin)
	if err != nil {
		return time.Time{}, time.Time{}, "", errors.New("fecha_fin inválida, use YYYY-MM-DD")
	}
	if fin.Before(inicio) {
		return time.Time{}, time.Time{}, "", errors.New("fecha_fin debe ser igual o posterior a fecha_inicio")
	}
	motivo = strings.TrimSpace(req.Motivo)
	if motivo == "" {
		return time.Time{}, time.Time{}, "", errors.New("la observación/motivo es obligatoria")
	}
	if len(motivo) > 500 {
		return time.Time{}, time.Time{}, "", errors.New("la observación no puede superar 500 caracteres")
	}
	return inicio, fin, motivo, nil
}

func (s *DiaSinFormacionFichaService) crearRegistroFicha(
	actorUserID, fichaID uint,
	inicio, fin time.Time,
	motivo string,
) (dto.DiaSinFormacionFichaItem, error) {
	ficha, errF := s.fichaRepo.FindByID(fichaID)
	if errF != nil || ficha == nil {
		return dto.DiaSinFormacionFichaItem{}, errors.New("ficha no encontrada")
	}
	row := &models.DiaSinFormacionFicha{
		FichaID:     fichaID,
		FechaInicio: fechaCalendario(inicio),
		FechaFin:    fechaCalendario(fin),
		Motivo:      motivo,
		ActorUserID: &actorUserID,
	}
	if err := s.repo.Create(row); err != nil {
		return dto.DiaSinFormacionFichaItem{}, err
	}
	created, errFind := s.repo.FindByID(row.ID)
	if errFind != nil {
		return s.toItem(row), nil
	}
	return s.toItem(created), nil
}

func (s *DiaSinFormacionFichaService) Create(
	actorUserID uint,
	req dto.DiaSinFormacionFichaCreateRequest,
) (*dto.DiaSinFormacionFichaCreateResponse, error) {
	inicio, fin, motivo, err := validarRangoYMotivoFicha(req)
	if err != nil {
		return nil, err
	}

	seen := make(map[uint]struct{}, len(req.FichaIDs))
	creados := make([]dto.DiaSinFormacionFichaItem, 0, len(req.FichaIDs))
	for _, fichaID := range req.FichaIDs {
		if fichaID == 0 {
			continue
		}
		if _, ok := seen[fichaID]; ok {
			continue
		}
		seen[fichaID] = struct{}{}
		item, errCreate := s.crearRegistroFicha(actorUserID, fichaID, inicio, fin, motivo)
		if errCreate != nil {
			return nil, errCreate
		}
		creados = append(creados, item)
	}
	if len(creados) == 0 {
		return nil, errors.New("seleccione al menos una ficha válida")
	}
	return &dto.DiaSinFormacionFichaCreateResponse{Creados: creados}, nil
}

func (s *DiaSinFormacionFichaService) Delete(id uint) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("registro no encontrado")
	}
	return s.repo.Delete(id)
}
