import type { AccesoLookupResponse } from '../../types';

/** Segundos mínimos entre la entrada y la salida automática. */
export const SEGUNDOS_ESPERA_SALIDA = 10;

/**
 * Segundos que faltan para poder registrar la salida de una visita abierta.
 * Se calcula desde la hora real de la entrada y se compara con el dato del backend,
 * quedándose con el mayor para no saltarse la espera nunca.
 */
export function segundosParaSalida(visita: AccesoLookupResponse): number {
  const porBackend = visita.segundos_restantes_salida ?? 0;
  const ts = visita.visita_abierta?.timestamp_entrada;
  if (!ts) return porBackend;
  const entrada = new Date(ts).getTime();
  if (Number.isNaN(entrada)) return porBackend;
  const transcurrido = (Date.now() - entrada) / 1000;
  if (transcurrido >= SEGUNDOS_ESPERA_SALIDA) return porBackend;
  const restante = Math.ceil(SEGUNDOS_ESPERA_SALIDA - transcurrido);
  return Math.max(porBackend, restante);
}
