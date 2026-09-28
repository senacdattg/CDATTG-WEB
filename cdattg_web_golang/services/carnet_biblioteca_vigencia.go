/**
 * Quito de biblioteca las fichas que ya terminaron.
 * Lo hice para que no sigan saliendo grupos cerrados ni sus personas.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

func (s *carnetDigitalService) soloSolicitudesFichaViva(list []models.CarnetSolicitud) ([]models.CarnetSolicitud, error) {
	fichas, err := s.solicitudRepo.FindFichasPorIDs(fichaIDsDeSolicitudes(list))
	if err != nil {
		return nil, err
	}
	return solicitudesDeFichasVivas(list, fichas, time.Now()), nil
}

func solicitudesDeFichasVivas(
	list []models.CarnetSolicitud,
	fichas map[uint]models.FichaCaracterizacion,
	hoy time.Time,
) []models.CarnetSolicitud {
	out := make([]models.CarnetSolicitud, 0, len(list))
	for i := range list {
		f, ok := fichas[list[i].FichaID]
		if !ok {
			continue
		}
		if calcularEstadoFicha(&f, hoy) {
			out = append(out, list[i])
		}
	}
	return out
}

func fichaVivaDeSolicitud(fichas map[uint]models.FichaCaracterizacion, fichaID uint, hoy time.Time) bool {
	f, ok := fichas[fichaID]
	if !ok {
		return false
	}
	return calcularEstadoFicha(&f, hoy)
}
