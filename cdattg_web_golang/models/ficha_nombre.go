package models

import "strings"

// NombreProgramaDisplay devuelve el título visible de la ficha:
// programa del catálogo si existe; si no, el nombre libre (Media Técnica / Complementaria).
func NombreProgramaDisplay(f *FichaCaracterizacion) string {
	if f == nil {
		return ""
	}
	if f.ProgramaFormacion != nil {
		if n := strings.TrimSpace(f.ProgramaFormacion.Nombre); n != "" {
			return n
		}
	}
	return strings.TrimSpace(f.Nombre)
}
