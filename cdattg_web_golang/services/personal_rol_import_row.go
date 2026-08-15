// @module personal_rol_import_row
// @description Procesamiento de una fila del Excel de importación de Guardas/Personal Administrativo.
// @author JDTWOR
// @created 2026-08-14
package services

import (
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
)

// tryImportRolRow intenta crear o vincular guarda o personal administrativo para una fila del Excel.
// Reutiliza rowToPersonaRequest y CreateWithoutUser del helper de instructores (DRY).
// Parámetros: tipo (guarda | personal_administrativo), row (celdas de la fila), colIndex (índice por
// columna), tipoByKey y generoByKey (catálogos). Retorna instructorImportRowResult con flags
// processed/duplicate/err y newPersonaID cuando se creó una persona nueva.
func (s *personalRolImportService) tryImportRolRow(tipo string, row []string, colIndex map[string]int, tipoByKey, generoByKey map[string]uint) instructorImportRowResult {
	var r instructorImportRowResult
	req := s.helper.rowToPersonaRequest(row, colIndex, tipoByKey, generoByKey)
	if req == nil {
		r.err = true
		return r
	}
	numeroDoc := strings.TrimSpace(req.NumeroDocumento)
	if numeroDoc == "" {
		r.err = true
		return r
	}

	persona, findErr := s.helper.personaRepo.FindByNumeroDocumento(numeroDoc)
	var personaID uint
	if findErr != nil || persona == nil {
		resp, createErr := s.helper.personaService.CreateWithoutUser(*req)
		if createErr != nil {
			if isPersonaDuplicadaErr(createErr) {
				r.duplicate = true
			} else {
				r.err = true
			}
			return r
		}
		personaID = resp.ID
		r.newPersonaID = personaID
	} else {
		personaID = persona.ID
	}

	switch tipo {
	case TipoRolGuarda:
		existing, _ := s.guardaRepo.FindByPersonaID(personaID)
		if existing != nil {
			r.duplicate = true
			return r
		}
		_, createErr := s.guardaSvc.CreateFromPersona(dto.CreateGuardaRequest{PersonaID: personaID})
		if createErr != nil {
			r.err = true
			return r
		}
	default:
		existing, _ := s.paRepo.FindByPersonaID(personaID)
		if existing != nil {
			r.duplicate = true
			return r
		}
		_, createErr := s.paSvc.CreateFromPersona(dto.CreatePersonalAdministrativoRequest{PersonaID: personaID})
		if createErr != nil {
			r.err = true
			return r
		}
	}
	r.processed = true
	return r
}