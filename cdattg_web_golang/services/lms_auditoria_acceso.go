// Este archivo decide quién puede abrir la auditoría LMS.
// Lo hice porque el aprendiz no debe ver carpetas de otros.
// Staff ve todas; el instructor solo las fichas donde está asignado.
// Lo usa LmsAuditoriaService.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/models"

type lmsAlcanceAuditoria struct {
	fichaIDs []uint
}

// exigirAuditoria staff sin tope de fichas; instructor solo las suyas.
func (s *lmsAuditoriaService) exigirAuditoria(userID uint) (*lmsAlcanceAuditoria, error) {
	user, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if lmsEsStaff(roles) {
		return &lmsAlcanceAuditoria{}, nil
	}
	if !listaTieneRolInstructor(roles) {
		return nil, ErrLmsSinAcceso
	}
	instID := s.acceso.instructorID(user)
	if instID == nil {
		return nil, ErrLmsSinAcceso
	}
	asig, err := s.instFichas.FindByInstructorID(*instID)
	if err != nil {
		return nil, err
	}
	ids := make([]uint, 0, len(asig))
	for i := range asig {
		ids = append(ids, asig[i].FichaID)
	}
	return &lmsAlcanceAuditoria{fichaIDs: ids}, nil
}

// personaEnAlcance staff sí; instructor si comparte al menos una ficha.
func personaEnAlcance(fichas []models.LmsCarpetaFicha, soloFichaIDs []uint) bool {
	if soloFichaIDs == nil {
		return true
	}
	ok := map[uint]struct{}{}
	for _, id := range soloFichaIDs {
		ok[id] = struct{}{}
	}
	for i := range fichas {
		if _, hay := ok[fichas[i].FichaID]; hay {
			return true
		}
	}
	return false
}

// fichasEnAlcance deja todas si es staff; si no, solo las fichas del instructor.
func fichasEnAlcance(fichas []models.LmsCarpetaFicha, soloFichaIDs []uint) []models.LmsCarpetaFicha {
	if soloFichaIDs == nil {
		return fichas
	}
	ok := map[uint]struct{}{}
	for _, id := range soloFichaIDs {
		ok[id] = struct{}{}
	}
	out := make([]models.LmsCarpetaFicha, 0, len(fichas))
	for i := range fichas {
		if _, hay := ok[fichas[i].FichaID]; hay {
			out = append(out, fichas[i])
		}
	}
	return out
}

// fichaIDEnAlcance staff ve todas; el instructor solo las suyas.
func fichaIDEnAlcance(id uint, solo []uint) bool {
	if solo == nil {
		return true
	}
	for _, x := range solo {
		if x == id {
			return true
		}
	}
	return false
}

// fichasModeloEnAlcance deja las fichas que el usuario puede auditar.
func fichasModeloEnAlcance(list []models.FichaCaracterizacion, solo []uint) []models.FichaCaracterizacion {
	if solo == nil {
		return list
	}
	out := make([]models.FichaCaracterizacion, 0, len(list))
	for i := range list {
		if fichaIDEnAlcance(list[i].ID, solo) {
			out = append(out, list[i])
		}
	}
	return out
}

// aprendicesEnAlcance deja matrículas de las fichas del instructor.
func aprendicesEnAlcance(list []models.Aprendiz, solo []uint) []models.Aprendiz {
	if solo == nil {
		return list
	}
	out := make([]models.Aprendiz, 0, len(list))
	for i := range list {
		if fichaIDEnAlcance(list[i].FichaCaracterizacionID, solo) {
			out = append(out, list[i])
		}
	}
	return out
}
