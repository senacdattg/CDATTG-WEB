/**
 * @module pages/lms/lmsActividadFiltro
 * @description Parte las actividades del aula en pendientes y ya entregadas.
 * Lo hice porque sin fecha de entrega también es una actividad pendiente.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsActividadItem } from '../../types/lms';
import { estadoPlazo } from './lmsActividadEstado';

/**
 * True si aún está pendiente: en plazo, por vencer o sin fecha.
 * @param {LmsActividadItem} a Publicación.
 * @param {Date} [now] Reloj inyectable en pruebas.
 * @returns {boolean} False solo cuando ya venció.
 */
export function actividadEnPlazo(a: LmsActividadItem, now = new Date()): boolean {
  return estadoPlazo(a.plazo_entrega, now) !== 'vencida';
}

/**
 * Pendientes: aprendiz lo que falta; instructor las que no están vencidas.
 * @param {LmsActividadItem[]} actividades Publicaciones del aula.
 * @param {boolean} esInstructor True si puede publicar.
 * @param {Date} [now] Reloj inyectable.
 * @returns {LmsActividadItem[]} Lista de pendientes.
 */
export function actividadesPendientes(
  actividades: LmsActividadItem[],
  esInstructor: boolean,
  now = new Date(),
): LmsActividadItem[] {
  if (esInstructor) return actividades.filter((a) => actividadEnPlazo(a, now));
  return actividades.filter((a) => a.entregada !== true);
}

/**
 * Trabajos de clase: aprendiz los que envió; instructor los que ya tienen envíos.
 * @param {LmsActividadItem[]} actividades Publicaciones del aula.
 * @param {boolean} esInstructor True si puede publicar.
 */
export function actividadesEntregadas(
  actividades: LmsActividadItem[],
  esInstructor: boolean,
): LmsActividadItem[] {
  if (esInstructor) return actividades.filter((a) => (a.cantidad_entregas ?? 0) > 0);
  return actividades.filter((a) => a.entregada === true);
}
