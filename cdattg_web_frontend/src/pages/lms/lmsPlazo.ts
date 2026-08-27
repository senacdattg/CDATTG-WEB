/**
 * @module pages/lms/lmsPlazo
 * @description Combina fecha y hora del plazo (calendario + escritura).
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { toDatetimeLocalColombia } from '../../utils/formatFecha';

/**
 * Une fecha (YYYY-MM-DD) y hora (HH:MM) en datetime-local.
 * @param {string} fecha Día elegido o escrito.
 * @param {string} hora Hora elegida o escrita. Vacío = 23:00.
 */
export function combinarPlazo(fecha: string, hora: string): string {
  const d = fecha.trim();
  if (!d) return '';
  const h = hora.trim() || '23:00';
  return `${d}T${h}`;
}

/**
 * Separa un ISO de plazo en fecha y hora para el formulario de edición.
 * @param iso Fecha de entrega persistida, o null si no hay plazo.
 */
export function partirPlazo(iso: string | null | undefined): { conPlazo: boolean; fecha: string; hora: string } {
  const local = toDatetimeLocalColombia(iso ?? undefined);
  if (!local.includes('T')) return { conPlazo: false, fecha: '', hora: '23:00' };
  const [fecha, hora] = local.split('T');
  return { conPlazo: true, fecha: fecha ?? '', hora: hora ?? '23:00' };
}
