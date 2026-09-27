/**
 * Cierro de un golpe las entradas sin salida. Lo hice para el día siguiente
 * no queden visitas abiertas. No pido motivo.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func idsACerrarSalidaMasiva(abiertas []models.PersonaIngresoSalida, excluir []uint) []uint {
	saltar := map[uint]struct{}{}
	for _, id := range excluir {
		if id > 0 {
			saltar[id] = struct{}{}
		}
	}
	out := make([]uint, 0, len(abiertas))
	for i := range abiertas {
		if _, ok := saltar[abiertas[i].ID]; ok {
			continue
		}
		out = append(out, abiertas[i].ID)
	}
	return out
}

func visitaPorID(abiertas []models.PersonaIngresoSalida, id uint) *models.PersonaIngresoSalida {
	for i := range abiertas {
		if abiertas[i].ID == id {
			return &abiertas[i]
		}
	}
	return nil
}

func personaDeVisita(s *vigilanciaAccesoService, row *models.PersonaIngresoSalida) (*models.Persona, error) {
	if row.Persona != nil {
		return row.Persona, nil
	}
	return s.personaRepo.FindByID(row.PersonaID)
}

// SalidaMasiva registra salida ahora en las visitas abiertas, excepto las excluidas.
func (s *vigilanciaAccesoService) SalidaMasiva(
	req dto.AccesoSalidaMasivaRequest,
	registradoPorUserID uint,
) (*dto.AccesoSalidaMasivaResponse, error) {
	sedeID, err := s.requireSedeID(&req.SedeID)
	if err != nil {
		return nil, err
	}
	abiertas, err := s.accesoRepo.ListAbiertasBySede(sedeID)
	if err != nil {
		return nil, err
	}
	aCerrar := idsACerrarSalidaMasiva(abiertas, req.ExcluirVisitaIDs)
	for _, id := range aCerrar {
		row := visitaPorID(abiertas, id)
		if row == nil {
			continue
		}
		persona, errP := personaDeVisita(s, row)
		if errP != nil {
			return nil, errP
		}
		if persona == nil {
			return nil, errors.New("persona no encontrada")
		}
		if _, errC := s.cerrarVisita(row, persona, "", "", "", registradoPorUserID, sedeID); errC != nil {
			return nil, errC
		}
	}
	quedan, err := s.accesoRepo.ListAbiertasBySede(sedeID)
	if err != nil {
		return nil, err
	}
	return &dto.AccesoSalidaMasivaResponse{
		Cerradas:  len(aCerrar),
		Excluidas: len(abiertas) - len(aCerrar),
		Quedan:    len(quedan),
	}, nil
}
