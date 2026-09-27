/**
 * Avisos de toast de las pestañas de accesos (salida, borrar, sin nombre).
 *
 * @author Cristian Deysdayr Jiménez
 */
import { mostrarToastApp } from '../../utils/appToast';

/** Listo: acción hecha. */
export function avisoAccesoOk(titulo: string, texto: string): void {
  mostrarToastApp({ icon: 'success', titulo, texto });
}

/** Falló: el usuario debe verlo ya. */
export function avisoAccesoError(texto: string): void {
  mostrarToastApp({ icon: 'error', titulo: 'No se pudo', texto });
}

/** Dato útil, sin ser error. */
export function avisoAccesoInfo(titulo: string, texto: string): void {
  mostrarToastApp({ icon: 'info', titulo, texto });
}

/** Canceló o falta un paso. */
export function avisoAccesoAviso(titulo: string, texto: string): void {
  mostrarToastApp({ icon: 'warning', titulo, texto });
}
