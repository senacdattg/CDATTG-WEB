/**
 * Petición y respuesta de la salida masiva de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
package dto

// AccesoSalidaMasivaRequest cierra ingresos abiertos de una sede, salvo los excluidos.
type AccesoSalidaMasivaRequest struct {
	SedeID           uint   `json:"sede_id" binding:"required"`
	ExcluirVisitaIDs []uint `json:"excluir_visita_ids"`
}

// AccesoSalidaMasivaResponse dice cuántos salieron y cuántos se dejaron adentro.
type AccesoSalidaMasivaResponse struct {
	Cerradas  int `json:"cerradas"`
	Excluidas int `json:"excluidas"`
	Quedan    int `json:"quedan"`
}
