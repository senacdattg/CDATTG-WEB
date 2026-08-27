/**
 * @module pages/lms/lmsAprendizToResponse
 * @description Adapta el aprendiz del aula al listado de ficha (DRY).
 * @author Cristian Deysdayr Jiménez
 */
import type { AprendizResponse } from '../../types';
import type { LmsAulaAprendiz } from '../../types/lms';

/**
 * Convierte un aprendiz LMS al contrato de FichaDetalleAprendicesTable.
 * @param {LmsAulaAprendiz} a Aprendiz del aula.
 * @param {number} fichaId Ficha actual.
 */
export function lmsAprendizToResponse(a: LmsAulaAprendiz, fichaId: number): AprendizResponse {
  return {
    id: a.id,
    persona_id: a.persona_id,
    persona_nombre: a.nombre,
    persona_documento: a.documento,
    ficha_caracterizacion_id: fichaId,
    estado: a.estado ?? true,
    oculto_en_asistencia: a.oculto_en_asistencia,
  };
}
