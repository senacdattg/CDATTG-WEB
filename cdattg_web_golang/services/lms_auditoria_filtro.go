// Este archivo limpia el texto de búsqueda y valida el tipo de formación.
// Lo hice para no meter % ni tipos inventados en la auditoría LMS.
// Lo usa LmsAuditoriaService.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"strings"
	"unicode"

	"github.com/sena/cdattg-web-golang/models"
)

const lmsAuditoriaQMax = 80

// lmsTextoAuditoria recorta y quita comodines de SQL.
func lmsTextoAuditoria(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.ReplaceAll(s, "%", "")
	s = strings.ReplaceAll(s, "_", "")
	if lmsEsCedulaConEspacios(s) {
		s = strings.ReplaceAll(s, " ", "")
	}
	if len(s) > lmsAuditoriaQMax {
		s = s[:lmsAuditoriaQMax]
	}
	return s
}

// lmsTipoAuditoriaValido true si es regular, media técnica o complementaria.
func lmsTipoAuditoriaValido(tipo string) bool {
	switch strings.TrimSpace(tipo) {
	case models.TipoFormacionRegular, models.TipoFormacionMediaTecnica, models.TipoFormacionComplementaria:
		return true
	default:
		return false
	}
}

// lmsEsNumeroFicha true si el texto parece un número de ficha (solo dígitos).
func lmsEsNumeroFicha(q string) bool {
	if len(q) < 3 {
		return false
	}
	for _, r := range q {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

// lmsEsCedulaConEspacios true si solo hay dígitos y espacios (cédula pegada con huecos).
func lmsEsCedulaConEspacios(s string) bool {
	digitos := 0
	for _, r := range s {
		if r == ' ' {
			continue
		}
		if !unicode.IsDigit(r) {
			return false
		}
		digitos++
	}
	return digitos >= 2
}

// lmsPaginaAuditoria deja la página en 1 si viene mal.
func lmsPaginaAuditoria(page int) int {
	if page < 1 {
		return 1
	}
	return page
}
