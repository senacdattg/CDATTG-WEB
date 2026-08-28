/**
 * @module pages/lms/lmsActividadEstado
 * @description Plazo de entrega: vencida, por vencer o en plazo.
 * @author Cristian Deysdayr Jiménez
 */
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
 * Etiqueta corta del estado de plazo.
 * @param {LmsEstadoPlazo} estado Clasificación.
 * @returns {string} Etiqueta visible.
 */
export function labelEstadoPlazo(estado: LmsEstadoPlazo): string {
  if (estado === 'vencida') return 'Vencida';
  if (estado === 'por_vencer') return 'Por vencer';
  if (estado === 'en_plazo') return 'En plazo';
  return 'Sin fecha de vencimiento';
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
