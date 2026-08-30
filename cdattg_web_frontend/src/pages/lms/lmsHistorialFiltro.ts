/**
 * @module pages/lms/lmsHistorialFiltro
 * @description Recorto el historial por nombre, actividad de la lista y estado.
 * Lo hice para buscar como en asistencia: activo u oculto.
 * Lo usa LmsAulaHistorial.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsHistorialFila } from '../../types/lms';

export type LmsHistorialEstadoFiltro = 'todos' | 'activos' | 'ocultos';

export type LmsHistorialFiltroQ = Readonly<{
  aprendiz: string;
  actividadId: number | null;
  estado: LmsHistorialEstadoFiltro;
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
 * Activo = sigue en la ficha y no está oculto en asistencia.
 * @param {LmsHistorialFila} fila Nota de la tabla.
 * @returns {boolean} Si está visible como en la toma.
 */
export function esActivoHistorial(fila: LmsHistorialFila): boolean {
  return fila.estado !== false && fila.oculto_en_asistencia !== true;
}

/**
 * True si el estado del aprendiz coincide con el chip.
 * @param {LmsHistorialFila} fila Nota de la tabla.
 * @param {LmsHistorialEstadoFiltro} estado Chip elegido.
 * @returns {boolean} Si pasa el recorte.
 */
export function coincideEstadoHistorial(fila: LmsHistorialFila, estado: LmsHistorialEstadoFiltro): boolean {
  if (estado === 'todos') return true;
  if (estado === 'ocultos') return fila.oculto_en_asistencia === true;
  return esActivoHistorial(fila);
}

/**
 * Deja las filas que pasan los tres filtros.
 * @param {LmsHistorialFila[]} filas Notas del aula.
 * @param {LmsHistorialFiltroQ} q Texto y chip.
 * @returns {LmsHistorialFila[]} Filas visibles.
 */
export function filtrarFilasHistorial(filas: LmsHistorialFila[], q: LmsHistorialFiltroQ): LmsHistorialFila[] {
  return filas.filter(
    (f) =>
      coincideAprendizHistorial(f, q.aprendiz) &&
      coincideActividadHistorial(f, q.actividadId) &&
      coincideEstadoHistorial(f, q.estado),
  );
}
