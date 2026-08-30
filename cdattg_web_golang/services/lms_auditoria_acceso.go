// Este archivo decide quién puede abrir la auditoría LMS.
// Lo hice para que solo el superadministrador vea las carpetas.
// Lo usa LmsAuditoriaService.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/models"

type lmsAlcanceAuditoria struct {
	fichaIDs []uint
}

// exigirAuditoria solo el superadministrador. Ve todas las fichas.
func (s *lmsAuditoriaService) exigirAuditoria(userID uint) (*lmsAlcanceAuditoria, error) {
	_, roles, err := s.usuarioYRoles(userID)
	if err != nil {
		return nil, err
	}
	if !lmsPuedeAuditar(roles) {
		return nil, ErrLmsSinAcceso
	}
	return &lmsAlcanceAuditoria{}, nil
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
