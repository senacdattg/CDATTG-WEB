/**
 * @module pages/lms/lmsActividadEstado
 * @description Plazo de entrega: vencida, por vencer o en plazo.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsActividadItem } from '../../types/lms';

export const HORAS_POR_VENCER = 72;

export type LmsEstadoPlazo = 'sin_plazo' | 'vencida' | 'por_vencer' | 'en_plazo';

/**
 * Clasifica una fecha de entrega respecto a ahora.
 * @param {string | null | undefined} plazo ISO o datetime.
 * @param {Date} [now] Reloj inyectable en pruebas.
 * @returns {LmsEstadoPlazo} Estado visual.
 */
export function estadoPlazo(plazo: string | null | undefined, now = new Date()): LmsEstadoPlazo {
  if (!plazo) return 'sin_plazo';
  const t = new Date(plazo).getTime();
  if (Number.isNaN(t)) return 'sin_plazo';
  if (t < now.getTime()) return 'vencida';
  const horas = (t - now.getTime()) / 36e5;
  if (horas <= HORAS_POR_VENCER) return 'por_vencer';
  return 'en_plazo';
}

/**
 * Trabajos de clase: actividades con plazo (vencidas o por vencer primero).
 * @param {LmsActividadItem[]} actividades Publicaciones del aula.
 */
export function actividadesTrabajoClase(actividades: LmsActividadItem[], now = new Date()): LmsActividadItem[] {
  const conPlazo = actividades.filter((a) => estadoPlazo(a.plazo_entrega, now) !== 'sin_plazo');
  const peso: Record<LmsEstadoPlazo, number> = { vencida: 0, por_vencer: 1, en_plazo: 2, sin_plazo: 3 };
  return [...conPlazo].sort((a, b) => peso[estadoPlazo(a.plazo_entrega, now)] - peso[estadoPlazo(b.plazo_entrega, now)]);
}

/**
 * Etiqueta corta del estado de plazo.
 * @param {LmsEstadoPlazo} estado Clasificación.
 */
export function labelEstadoPlazo(estado: LmsEstadoPlazo): string {
  if (estado === 'vencida') return 'Vencida';
  if (estado === 'por_vencer') return 'Por vencer';
  if (estado === 'en_plazo') return 'En plazo';
  return '';
}

/**
 * Texto del botón de envío (solo si aún no está entregada).
 * @param {string | null | undefined} plazo Fecha límite.
 * @param {Date} [now] Reloj inyectable.
 */
export function etiquetaEntregaAlumno(plazo: string | null | undefined, now = new Date()): string {
  const vencida = Boolean(plazo && new Date(plazo).getTime() < now.getTime());
  if (vencida) return 'Entregar con retraso';
  return 'Entregar';
}

/**
 * Estado visible de la entrega del aprendiz.
 * @param {string | null | undefined} entregadoEn Fecha de envío.
 * @param {boolean} tardia Si llegó fuera de plazo.
 */
export function labelEstadoEntrega(entregadoEn: string | null | undefined, tardia: boolean): string {
  if (entregadoEn && tardia) return 'Entregada con retraso';
  if (entregadoEn) return 'Entregada';
  return 'No entregada';
}
