/**
 * @module pages/portal/portalCarouselLogic
 * @description Índice e intervalo del carrusel de banners.
 * @author Cristian Deysdayr Jiménez
 */

export const CARRUSEL_INTERVALO_MS = 5000;

const CAPA_BASE = 'absolute inset-0 transition-opacity duration-700 ease-in-out';

/**
 * Capa visible u oculta para el fundido cruzado.
 */
export function claseCapaCarrusel(activa: boolean): string {
  return activa ? `${CAPA_BASE} opacity-100` : `${CAPA_BASE} pointer-events-none opacity-0`;
}

/**
 * Siguiente diapositiva; vuelve a 0 al final.
 */
export function siguienteIndiceCarrusel(actual: number, total: number): number {
  if (total <= 0) return 0;
  return (actual + 1) % total;
}

/**
 * Solo http(s) o ruta interna; evita javascript: y //.
 */
export function hrefCarruselSeguro(raw: string): string {
  const s = raw.trim();
  if (!s) return '';
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const u = new URL(s);
    if (u.protocol === 'http:' || u.protocol === 'https:') return s;
  } catch {
    return '';
  }
  return '';
}
