// Este archivo convierte carpetas LMS a la respuesta de auditoría.
// Lo hice para no repetir cédula, nombre y tipos en cada endpoint.
// Lo usa LmsAuditoriaService.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func mapAuditoriaPersona(row models.LmsCarpetaPersona) dto.LmsAuditoriaPersonaItem {
	doc, nombre := "", ""
	if row.Persona != nil {
		doc = row.Persona.NumeroDocumento
		nombre = row.Persona.GetFullName()
	}
	return dto.LmsAuditoriaPersonaItem{
		PersonaID:     row.PersonaID,
		Documento:     doc,
		Nombre:        nombre,
		NombreCarpeta: row.NombreCarpeta,
	}
}

func lmsTiposAuditoria(fichas []models.LmsCarpetaFicha) []dto.LmsAuditoriaTipoItem {
	conteo := map[string]int{}
	for i := range fichas {
		conteo[fichas[i].TipoFormacion]++
	}
	out := make([]dto.LmsAuditoriaTipoItem, 0, len(tiposFormacionLms))
	for _, tipo := range tiposFormacionLms {
		out = append(out, dto.LmsAuditoriaTipoItem{
			Tipo:           tipo,
			NombreCarpeta:  NombreCarpetaTipo(tipo),
			CantidadFichas: conteo[tipo],
		})
	}
	return out
}

func mapPersonaAItem(p models.Persona) dto.LmsAuditoriaPersonaItem {
	nombre := p.GetFullName()
	return dto.LmsAuditoriaPersonaItem{
		PersonaID:     p.ID,
		Documento:     p.NumeroDocumento,
		Nombre:        nombre,
		NombreCarpeta: NombreCarpetaPersona(p.NumeroDocumento, nombre),
	}
}

func mapAuditoriaFila(ap models.Aprendiz) dto.LmsAuditoriaFila {
	doc, nombre := "", ""
	if ap.Persona != nil {
		doc = ap.Persona.NumeroDocumento
		nombre = ap.Persona.GetFullName()
	}
	ficha, prog, regional := "", "", ""
	var fichaID uint
	if ap.FichaCaracterizacion != nil {
		fichaID = ap.FichaCaracterizacion.ID
		ficha = ap.FichaCaracterizacion.Ficha
		prog = models.NombreProgramaDisplay(ap.FichaCaracterizacion)
		regional = regionalDeFicha(ap.FichaCaracterizacion)
	}
	return dto.LmsAuditoriaFila{
		PersonaID: ap.PersonaID, Nombre: nombre, Documento: doc,
		FichaID: fichaID, NumeroFicha: ficha, Programa: prog, Regional: regional,
		Estado: ap.Estado, NombreCarpeta: NombreCarpetaPersona(doc, nombre),
	}
}

func filasDeAprendices(list []models.Aprendiz) []dto.LmsAuditoriaFila {
	out := make([]dto.LmsAuditoriaFila, 0, len(list))
	for i := range list {
		out = append(out, mapAuditoriaFila(list[i]))
	}
	return out
}

func regionalDeFicha(f *models.FichaCaracterizacion) string {
	if f == nil || f.Sede == nil || f.Sede.Regional == nil {
		return ""
	}
	return f.Sede.Regional.Nombre
}

func mapArchivosEntrega(e models.LmsEntrega) []dto.LmsArchivoItem {
	out := make([]dto.LmsArchivoItem, 0, len(e.Archivos))
	for i := range e.Archivos {
		out = append(out, dto.LmsArchivoItem{
			ID: e.Archivos[i].ID, Nombre: e.Archivos[i].NombreOriginal, Tamano: e.Archivos[i].Tamano,
		})
	}
	return out
}
