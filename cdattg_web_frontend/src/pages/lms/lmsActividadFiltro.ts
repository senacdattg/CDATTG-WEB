/**
 * @module pages/lms/lmsActividadFiltro
 * @description Parte las actividades en pendientes, entregadas y vencidas.
 * Lo hice para que el aprendiz no mezcle lo que falta con lo que ya venció.
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
 * Pendientes: lo que falta y aún está en plazo. El staff ve las no vencidas.
 * @param {LmsActividadItem[]} actividades Publicaciones del aula.
 * @param {boolean} esStaff True si mira como instructor o superadmin.
 * @param {Date} [now] Reloj inyectable.
 * @returns {LmsActividadItem[]} Lista de pendientes.
 */
export function actividadesPendientes(
  actividades: LmsActividadItem[],
  esStaff: boolean,
  now = new Date(),
): LmsActividadItem[] {
  if (esStaff) return actividades.filter((a) => actividadEnPlazo(a, now));
  return actividades.filter((a) => a.entregada !== true && actividadEnPlazo(a, now));
}

/**
 * Entregadas: aprendiz las que envió; staff las que ya tienen envíos.
 * @param {LmsActividadItem[]} actividades Publicaciones del aula.
 * @param {boolean} esStaff True si mira como instructor o superadmin.
 * @returns {LmsActividadItem[]} Lista de entregadas.
 */
export function actividadesEntregadas(
  actividades: LmsActividadItem[],
  esStaff: boolean,
): LmsActividadItem[] {
  if (esStaff) return actividades.filter((a) => (a.cantidad_entregas ?? 0) > 0);
  return actividades.filter((a) => a.entregada === true);
}

/**
 * Vencidas: aprendiz las que no envió y ya pasó el plazo; staff las vencidas.
 * @param {LmsActividadItem[]} actividades Publicaciones del aula.
 * @param {boolean} esStaff True si mira como instructor o superadmin.
 * @param {Date} [now] Reloj inyectable.
 * @returns {LmsActividadItem[]} Lista de vencidas.
 */
export function actividadesVencidas(
  actividades: LmsActividadItem[],
  esStaff: boolean,
  now = new Date(),
): LmsActividadItem[] {
  if (esStaff) return actividades.filter((a) => !actividadEnPlazo(a, now));
  return actividades.filter((a) => a.entregada !== true && !actividadEnPlazo(a, now));
}
