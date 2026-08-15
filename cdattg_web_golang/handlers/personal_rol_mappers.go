// @module personal_rol_mappers
// @description Conversión de modelos Guarda/PersonalAdministrativo a DTO RolPersonalItem.
// @author JDTWOR
// @created 2026-08-14
package handlers

import (
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

// guardaToRolItem convierte un modelo Guarda en RolPersonalItem usando la Persona vinculada.
// Documento y nombre provienen de Persona; si no hay Persona, usa los cachés del modelo.
func guardaToRolItem(m models.Guarda) dto.RolPersonalItem {
	var nombre, doc string
	if m.Persona != nil {
		nombre = m.Persona.GetFullName()
		doc = m.Persona.NumeroDocumento
	}
	if nombre == "" {
		nombre = m.NombreCompletoCache
	}
	if doc == "" {
		doc = m.NumeroDocumentoCache
	}
	return dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}

// personalAdministrativoToRolItem convierte un modelo PersonalAdministrativo en RolPersonalItem.
// Documento y nombre provienen de Persona; si no hay Persona, usa los cachés del modelo.
func personalAdministrativoToRolItem(m models.PersonalAdministrativo) dto.RolPersonalItem {
	var nombre, doc string
	if m.Persona != nil {
		nombre = m.Persona.GetFullName()
		doc = m.Persona.NumeroDocumento
	}
	if nombre == "" {
		nombre = m.NombreCompletoCache
	}
	if doc == "" {
		doc = m.NumeroDocumentoCache
	}
	return dto.RolPersonalItem{ID: m.ID, Nombre: nombre, NumeroDocumento: doc, Estado: m.Status}
}