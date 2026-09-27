/**
 * Fechas y frase para borrar visitas de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */

export const FRASE_BORRAR_ACCESO = 'ELIMINAR';

/**
 * Armo la fecha de hoy en YYYY-MM-DD.
 */
export function hoyISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Retrocedo n días desde hoy.
 */
export function haceDiasISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Las dos frases deben ser exactamente ELIMINAR.
 */
export function puedeConfirmarBorrar(c1: string, c2: string): boolean {
  return c1 === FRASE_BORRAR_ACCESO && c2 === FRASE_BORRAR_ACCESO;
}

/**
 * Hay que indicar al menos un extremo de fecha.
 */
export function hayRangoFechas(desde: string, hasta: string): boolean {
  return Boolean(desde.trim() || hasta.trim());
}

export type AtajoFechaAcceso = 'hoy' | '7d' | 'historico' | '';

/**
 * Digo qué atajo está activo según las fechas, para pintar el botón.
 */
export function atajoFechaAcceso(desde: string, hasta: string): AtajoFechaAcceso {
  const hoy = hoyISO();
  if (desde === hoy && hasta === hoy) return 'hoy';
  if (desde === haceDiasISO(7) && hasta === hoy) return '7d';
  if (desde === '' && hasta === hoy) return 'historico';
  return '';
}
