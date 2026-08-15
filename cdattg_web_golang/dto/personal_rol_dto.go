// @module personal_rol_dto
// @description DTOs de Guardas y Personal Administrativo (listado, creación y actualización).
// @author JDTWOR
// @created 2026-08-14
package dto

// RolPersonalItem respuesta de guarda o personal administrativo para listados.
// Documento y nombre se obtienen de Persona (la fila solo tiene persona_id).
type RolPersonalItem struct {
	ID              uint   `json:"id"`
	Nombre          string `json:"nombre"`
	NumeroDocumento string `json:"numero_documento"`
	Estado          bool   `json:"estado"`
}

// CreateGuardaRequest crea una guarda a partir de una persona
type CreateGuardaRequest struct {
	PersonaID uint `json:"persona_id" binding:"required"`
}

// UpdateGuardaRequest actualiza el estado de una guarda
type UpdateGuardaRequest struct {
	Estado *bool `json:"estado"`
}

// CreatePersonalAdministrativoRequest crea personal administrativo a partir de una persona
type CreatePersonalAdministrativoRequest struct {
	PersonaID uint `json:"persona_id" binding:"required"`
}

// UpdatePersonalAdministrativoRequest actualiza el estado de personal administrativo
type UpdatePersonalAdministrativoRequest struct {
	Estado *bool `json:"estado"`
}