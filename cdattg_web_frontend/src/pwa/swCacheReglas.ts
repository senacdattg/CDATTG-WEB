/**
 * Reglas del service worker: qué pido a la red y qué guardo.
 *
 * Las copio en public/sw.js porque el worker no importa TypeScript.
 *
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Intercepto GET del mismo sitio, menos /api.
 * @param method Método HTTP
 * @param requestOrigin Origen de la petición
 * @param pageOrigin Origen de la app
 * @param pathname Ruta
 * @returns true si el worker debe responder
 */
export function debeInterceptarFetch(
  method: string,
  requestOrigin: string,
  pageOrigin: string,
  pathname: string,
): boolean {
  if (method !== 'GET') return false;
  if (requestOrigin !== pageOrigin) return false;
  if (pathname.startsWith('/api/')) return false;
  return true;
}

/**
 * Solo guardo 200–299. Un 502 no debe quedar como pantalla.
 * @param ok Si la respuesta HTTP fue buena
 * @returns true si va a la caché
 */
export function debeGuardarEnCache(ok: boolean): boolean {
  return ok;
}
