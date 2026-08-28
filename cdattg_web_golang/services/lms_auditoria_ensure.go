// Este archivo crea la carpeta raíz y la de ficha si la persona ya estaba en el sistema.
// Lo hice porque esas carpetas solo se armaban al registrarse de nuevo.
// Lo usan buscar, listar ficha y abrir persona.
//
// @author Cristian Deysdayr Jiménez
package services

import "github.com/sena/cdattg-web-golang/models"

func (s *lmsAuditoriaService) asegurarPersonaYFichas(personaID uint) {
	EnsurePersonaLmsCarpetas(personaID)
	aps, err := s.aprendices.FindAllByPersonaID(personaID)
	if err != nil {
		return
	}
	asegurarCarpetasAprendices(aps)
}

func asegurarCarpetasAprendices(list []models.Aprendiz) {
	for i := range list {
		EnsurePersonaLmsCarpetas(list[i].PersonaID)
		EnsureCarpetaFichaLms(list[i].PersonaID, list[i].FichaCaracterizacionID)
	}
}
