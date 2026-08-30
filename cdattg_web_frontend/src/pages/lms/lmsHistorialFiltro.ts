/**
 * @module pages/lms/lmsHistorialFiltro
 * @description Recorto el historial por nombre de aprendiz.
 * Lo hice para buscar como en asistencia.
 * Lo usa LmsAulaHistorial.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsHistorialFila } from '../../types/lms';

/**
 * True si el nombre del aprendiz coincide con lo escrito.
 * @param {LmsHistorialFila} fila Nota de la tabla.
 * @param {string} q Texto del recuadro.
 * @returns {boolean} Si pasa el recorte.
 */
export function coincideAprendizHistorial(fila: LmsHistorialFila, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return fila.aprendiz_nombre.toLowerCase().includes(t);
}

/**
 * Deja las filas cuyo aprendiz coincide.
 * @param {LmsHistorialFila[]} filas Notas del aula.
 * @param {string} aprendiz Texto del recuadro.
 * @returns {LmsHistorialFila[]} Filas visibles.
 */
export function filtrarFilasHistorial(filas: LmsHistorialFila[], aprendiz: string): LmsHistorialFila[] {
  return filas.filter((f) => coincideAprendizHistorial(f, aprendiz));
}
