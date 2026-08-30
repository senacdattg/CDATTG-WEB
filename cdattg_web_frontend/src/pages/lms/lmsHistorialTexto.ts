/**
 * @module pages/lms/lmsHistorialTexto
 * @description Texto de la nota: cuánto sacó sobre el tope.
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Muestra 85 / 100 o Sin nota / 100.
 * @param {number | null} nota Calificación o vacío.
 * @param {number} tope Puntos que puso el instructor.
 * @returns {string} Texto de la celda.
 */
export function textoNotaHistorial(nota: number | null, tope: number): string {
  if (nota == null) return `Sin nota / ${tope}`;
  return `${nota} / ${tope}`;
}
