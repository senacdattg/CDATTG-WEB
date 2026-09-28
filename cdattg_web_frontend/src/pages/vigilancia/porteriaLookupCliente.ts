/**
 * Busco la persona: primero lo guardado, y el servidor con tope de tiempo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { apiService } from '../../services/api';
import type { AccesoLookupResponse, AccesoModo } from '../../types';
import { aplicarColaAlLookup } from './porteriaCola';
import { guardarLookup, leerCola, leerLookupGuardado } from './porteriaMemoria';
import { lookupLocal } from './porteriaLookupLocal';
import { conTope, hayRed, TOPE_LOOKUP_MS } from './porteriaTiemposRed';

type LookupIn = {
  numero_documento: string;
  sede_id: number;
  metodo?: string;
  modo?: AccesoModo;
};

/** Lo dejo en ENTRADA o SALIDA, sin mezclar con string suelto. */
function modoLookup(modo?: AccesoModo): AccesoModo {
  return modo === 'SALIDA' ? 'SALIDA' : 'ENTRADA';
}

async function conCola(lookup: AccesoLookupResponse): Promise<AccesoLookupResponse> {
  const cola = await leerCola();
  return aplicarColaAlLookup(lookup, cola);
}

/**
 * Lookup rápido: si hay red espero poco; si no, uso copia o persona nueva.
 */
export async function lookupPorteria(data: LookupIn): Promise<AccesoLookupResponse> {
  const doc = data.numero_documento;
  const sede = data.sede_id;
  const modo = modoLookup(data.modo);
  const guardado = await leerLookupGuardado(sede, doc);

  if (hayRed()) {
    try {
      const res = await conTope(apiService.accesoLookup(data), TOPE_LOOKUP_MS);
      await guardarLookup(sede, doc, res);
      return conCola(res);
    } catch {
      const local = lookupLocal(doc, sede, modo, guardado);
      return conCola(local);
    }
  }

  return conCola(lookupLocal(doc, sede, modo, guardado));
}
