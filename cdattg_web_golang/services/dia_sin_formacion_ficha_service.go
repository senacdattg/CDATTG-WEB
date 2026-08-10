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
		item.ProgramaNombre = models.NombreProgramaDisplay(row.Ficha)
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

func (s *DiaSinFormacionFichaService) resolverFichaIDsCreate(req dto.DiaSinFormacionFichaCreateRequest) ([]uint, error) {
	ids := make([]uint, 0, len(req.FichaIDs))
	seen := make(map[uint]struct{})
	for _, id := range req.FichaIDs {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		ids = append(ids, id)
	}
	if len(ids) > 0 {
		return ids, nil
	}
	if len(req.SedeIDs) == 0 {
		return nil, errors.New("seleccione al menos una ficha o una sede")
	}
	tipos := make([]string, 0, len(req.TiposFormacion))
	for _, t := range req.TiposFormacion {
		norm, err := normalizeTipoFormacionFilter(t)
		if err != nil {
			return nil, err
		}
		if norm == "" {
			continue
		}
		tipos = append(tipos, norm)
	}
	if len(tipos) == 0 {
		return nil, errors.New("indique al menos un tipo de formación al filtrar por sede")
	}
	resolved, err := s.fichaRepo.ListIDsBySedesAndTipos(req.SedeIDs, tipos)
	if err != nil {
		return nil, err
	}
	if len(resolved) == 0 {
		return nil, errors.New("no hay fichas activas para las sedes y tipos de formación seleccionados")
	}
	return resolved, nil
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
	fichaIDs, err := s.resolverFichaIDsCreate(req)
	if err != nil {
		return nil, err
	}

	creados := make([]dto.DiaSinFormacionFichaItem, 0, len(fichaIDs))
	for _, fichaID := range fichaIDs {
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
