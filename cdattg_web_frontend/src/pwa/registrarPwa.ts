/**
 * Activo el Service Worker para que la pantalla quede guardada sin red.
 *
 * Lo uso al arrancar la app. No lo registro en desarrollo local de Vite.
 *
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Pido al navegador que recuerde la app.
 */
export function registrarPwa(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;
  void navigator.serviceWorker.register('/sw.js').catch(() => {
    /* Si el navegador no deja, portería sigue con la cola local. */
  });
}
