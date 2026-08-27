package services

import (
	"fmt"
	"path"
	"strings"
	"unicode"

	"github.com/sena/cdattg-web-golang/models"
)

const lmsStorageRoot = "storage/lms"

// NombreCarpetaTipo carpeta fija según tipo de formación.
func NombreCarpetaTipo(tipoFormacion string) string {
	switch strings.TrimSpace(tipoFormacion) {
	case models.TipoFormacionMediaTecnica:
		return "Media Tecnica"
	case models.TipoFormacionComplementaria:
		return "Formacion Complementaria"
	default:
		return "Formacion Regular"
	}
}

// NombreCarpetaPersona arma "{documento} {nombre}" sanitizado.
func NombreCarpetaPersona(documento, nombreCompleto string) string {
	return SanitizarNombreCarpeta(strings.TrimSpace(documento) + " " + strings.TrimSpace(nombreCompleto))
}

// NombreCarpetaFicha arma "{numero} {programa}" sanitizado.
func NombreCarpetaFicha(numeroFicha, nombrePrograma string) string {
	prog := strings.TrimSpace(nombrePrograma)
	if prog == "" {
		prog = "SIN PROGRAMA"
	}
	return SanitizarNombreCarpeta(strings.TrimSpace(numeroFicha) + " " + prog)
}

// SanitizarNombreCarpeta quita caracteres peligrosos para rutas.
func SanitizarNombreCarpeta(raw string) string {
	replacer := strings.NewReplacer("/", " ", "\\", " ", ":", " ", "*", " ", "?", " ", "\"", " ", "<", " ", ">", " ", "|", " ")
	limpio := strings.TrimSpace(replacer.Replace(raw))
	var b strings.Builder
	prevSpace := false
	for _, r := range limpio {
		if unicode.IsSpace(r) {
			if !prevSpace {
				b.WriteRune(' ')
				prevSpace = true
			}
			continue
		}
		prevSpace = false
		b.WriteRune(r)
	}
	out := strings.TrimSpace(b.String())
	if out == "" {
		return "sin-nombre"
	}
	return out
}

// RutaCarpetaPersona ruta relativa raíz LMS de la persona.
func RutaCarpetaPersona(nombreCarpeta string) string {
	return path.Join(lmsStorageRoot, nombreCarpeta)
}

// RutaCarpetaTipo ruta de una de las tres carpetas de tipo.
func RutaCarpetaTipo(nombrePersona, tipoFormacion string) string {
	return path.Join(RutaCarpetaPersona(nombrePersona), NombreCarpetaTipo(tipoFormacion))
}

// RutaCarpetaFicha ruta donde se guardan archivos de esa ficha.
func RutaCarpetaFicha(nombrePersona, tipoFormacion, nombreFicha string) string {
	return path.Join(RutaCarpetaTipo(nombrePersona, tipoFormacion), nombreFicha)
}

// RutaPublicacionLMS carpeta de adjuntos de una publicación del aula.
func RutaPublicacionLMS(fichaID, actividadID uint) string {
	return path.Join(lmsStorageRoot, "publicaciones", fmt.Sprint(fichaID), fmt.Sprint(actividadID))
}

// RutaEntregaLMS carpeta de adjuntos de un envío del aprendiz.
func RutaEntregaLMS(fichaID, actividadID, aprendizID uint) string {
	return path.Join(lmsStorageRoot, "entregas", fmt.Sprint(fichaID), fmt.Sprint(actividadID), fmt.Sprint(aprendizID))
}
