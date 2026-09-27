/**
 * Marco el carnet como listo cuando biblioteca ya lo procesó (impreso o entregado).
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/models"
)

var errCarnetFichaTerminada = errors.New("esta ficha ya finalizó")

// MarcarListoBiblioteca pone o quita la marca de listo en un regular aprobado.
func (s *carnetDigitalService) MarcarListoBiblioteca(solicitudID uint, listo bool) error {
	sol, err := s.solicitudRepo.FindByID(solicitudID)
	if err != nil {
		return err
	}
	if !esCarnetParaBiblioteca(sol) {
		return errCarnetNoBiblioteca
	}
	fichas, err := s.solicitudRepo.FindFichasPorIDs([]uint{sol.FichaID})
	if err != nil {
		return err
	}
	if !fichaVivaDeSolicitud(fichas, sol.FichaID, time.Now()) {
		return errCarnetFichaTerminada
	}
	aplicarMarcaListo(sol, listo, time.Now())
	return s.solicitudRepo.Update(sol)
}

func aplicarMarcaListo(sol *models.CarnetSolicitud, listo bool, ahora time.Time) {
	sol.Listo = listo
	if listo {
		sol.ListoEn = &ahora
		return
	}
	sol.ListoEn = nil
}
