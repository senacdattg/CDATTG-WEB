/**
 * @module pages/lms/lmsAulaToFicha
 * @description Adapta el ítem de Mis aulas a la tarjeta de ficha de asistencia.
 * @author Cristian Deysdayr Jiménez
 */
import type { FichaCaracterizacionResponse } from '../../types';
import type { LmsAulaListItem } from '../../types/lms';

/**
 * Convierte un aula LMS al contrato de FichaCaracterizacionCard.
 * @param {LmsAulaListItem} aula Aula listada.
 * @returns {FichaCaracterizacionResponse} Ficha para la tarjeta.
 */
export function aulaToFichaCard(aula: LmsAulaListItem): FichaCaracterizacionResponse {
  return {
    id: aula.ficha_id,
    ficha: aula.numero_ficha,
    nombre: aula.nombre_programa,
    programa_formacion_nombre: aula.nombre_programa,
    tipo_formacion: aula.tipo_formacion,
    instructor_nombre: aula.instructor_nombre,
    sede_nombre: aula.sede_nombre,
    ambiente_nombre: aula.ambiente_nombre,
    jornada_nombre: aula.jornada_nombre,
    modalidad_formacion_nombre: aula.modalidad_formacion_nombre,
    status: aula.status ?? true,
    cantidad_aprendices: aula.cantidad_aprendices,
  };
}
