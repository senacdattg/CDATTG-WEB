/**
 * @module pages/lms/lmsHistorialFiltro
 * @description Recorto el historial por nombre y actividad de la lista.
 * Lo usa LmsAulaHistorial.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsHistorialFila } from '../../types/lms';

export type LmsHistorialFiltroQ = Readonly<{
  aprendiz: string;
  actividadId: number | null;
}>;

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
 * True si la fila es de la actividad elegida en la lista.
 * @param {LmsHistorialFila} fila Nota de la tabla.
 * @param {number | null} actividadId Id de la lista o vacío.
 * @returns {boolean} Si pasa el recorte.
 */
export function coincideActividadHistorial(fila: LmsHistorialFila, actividadId: number | null): boolean {
  if (actividadId == null) return true;
  return fila.actividad_id === actividadId;
}

/**
 * Leo el id de la lista. Si está vacío o no es número, no recorto.
 * @param {string} raw Valor del desplegable.
 * @returns {number | null} Id o vacío.
 */
export function leerActividadId(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const id = Number(t);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

/**
 * Deja las filas que pasan aprendiz y actividad.
 * @param {LmsHistorialFila[]} filas Notas del aula.
 * @param {LmsHistorialFiltroQ} q Texto y lista.
 * @returns {LmsHistorialFila[]} Filas visibles.
 */
export function filtrarFilasHistorial(filas: LmsHistorialFila[], q: LmsHistorialFiltroQ): LmsHistorialFila[] {
  return filas.filter(
    (f) => coincideAprendizHistorial(f, q.aprendiz) && coincideActividadHistorial(f, q.actividadId),
  );
}
