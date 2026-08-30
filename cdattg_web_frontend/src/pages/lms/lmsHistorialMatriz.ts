/**
 * @module pages/lms/lmsHistorialMatriz
 * @description Paso las filas sueltas a una tabla: un nombre y varias actividades.
 * Lo hice porque repetir el nombre en vertical se veía feo.
 * Lo usa LmsAulaHistorialTabla.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsHistorialFila } from '../../types/lms';

export type LmsHistorialColumna = Readonly<{ actividadId: number; titulo: string }>;

export type LmsHistorialPersona = Readonly<{
  aprendizId: number;
  nombre: string;
  notas: Array<LmsHistorialFila | null>;
}>;

/**
 * Columnas: cada actividad una sola vez, por título.
 * @param {LmsHistorialFila[]} filas Notas sueltas.
 * @returns {LmsHistorialColumna[]} Actividades de la tabla.
 */
export function columnasHistorial(filas: LmsHistorialFila[]): LmsHistorialColumna[] {
  const seen = new Map<number, string>();
  filas.forEach((f) => {
    if (!seen.has(f.actividad_id)) seen.set(f.actividad_id, f.titulo);
  });
  return [...seen.entries()]
    .map(([actividadId, titulo]) => ({ actividadId, titulo }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es') || a.actividadId - b.actividadId);
}

/**
 * Un aprendiz por fila, con la nota de cada actividad.
 * @param {LmsHistorialFila[]} filas Notas sueltas.
 * @param {LmsHistorialColumna[]} columnas Actividades en orden.
 * @returns {LmsHistorialPersona[]} Filas de la tabla.
 */
export function personasHistorial(
  filas: LmsHistorialFila[],
  columnas: LmsHistorialColumna[],
): LmsHistorialPersona[] {
  const porPersona = new Map<number, LmsHistorialFila[]>();
  filas.forEach((f) => {
    const list = porPersona.get(f.aprendiz_id) ?? [];
    list.push(f);
    porPersona.set(f.aprendiz_id, list);
  });
  return [...porPersona.entries()].map(([aprendizId, list]) => ({
    aprendizId,
    nombre: list[0]?.aprendiz_nombre ?? '',
    notas: columnas.map((col) => list.find((f) => f.actividad_id === col.actividadId) ?? null),
  }));
}

/**
 * Arma columnas y personas para pintar la tabla.
 * @param {LmsHistorialFila[]} filas Notas sueltas.
 */
export function armarMatrizHistorial(filas: LmsHistorialFila[]) {
  const columnas = columnasHistorial(filas);
  return { columnas, personas: personasHistorial(filas, columnas) };
}
