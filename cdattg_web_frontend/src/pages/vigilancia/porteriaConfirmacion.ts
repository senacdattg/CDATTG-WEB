/**
 * Decido si la portería pide confirmar o registra sola.
 *
 * Lo hice porque solo la persona que aún no existe en el sistema
 * debe confirmar. Quien ya está registrado entra o sale solo.
 *
 * Lo uso en VigilanciaPorteria y en las pruebas de este archivo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoLookupResponse } from '../../types';

/**
 * Solo confirmo si esa cédula no está en el sistema.
 */
export function requiereConfirmacionSalida(res: AccesoLookupResponse): boolean {
  return Boolean(res.persona.es_nueva);
}

/**
 * Quien ya existe sale solo: con visita abierta o salida irregular.
 */
export function debeSalidaAutomatica(res: AccesoLookupResponse): boolean {
  return !res.persona.es_nueva;
}
