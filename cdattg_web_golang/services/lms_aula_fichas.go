// Este archivo arma el listado de aulas del usuario.
// Lo hice porque si había fila de instructor (aunque inactiva) el LMS
// no mostraba las fichas donde solo es aprendiz. Lo usa ListAulas.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/models"

// unirFichasAula junta fichas de instructor y de aprendiz sin repetir.
func unirFichasAula(a, b []models.FichaCaracterizacion) []models.FichaCaracterizacion {
	seen := make(map[uint]bool, len(a)+len(b))
	out := make([]models.FichaCaracterizacion, 0, len(a)+len(b))
	for _, list := range [][]models.FichaCaracterizacion{a, b} {
		for i := range list {
			if seen[list[i].ID] {
				continue
			}
			seen[list[i].ID] = true
			out = append(out, list[i])
		}
	}
	return out
}

func (s *lmsAulaService) fichasDeUsuario(user *models.User, roles []string) ([]models.FichaCaracterizacion, error) {
	if lmsEsStaff(roles) {
		list, _, err := s.fichas.FindAll(1, 200, nil, nil, "", "")
		return list, err
	}
	var instList []models.FichaCaracterizacion
	if instID := s.acceso.instructorID(user); instID != nil {
		list, _, err := s.fichas.FindAll(1, 200, nil, instID, "", "")
		if err != nil {
			return nil, err
		}
		instList = list
	}
	apr, err := s.acceso.fichasDeAprendiz(user)
	if err != nil {
		return nil, err
	}
	return unirFichasAula(instList, apr), nil
}
