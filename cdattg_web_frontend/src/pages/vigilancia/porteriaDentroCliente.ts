/**
 * Lista de personas adentro: servidor con tope, o la copia + cola.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { apiService } from '../../services/api';
import type { AccesoDentroItem } from '../../types';
import { aplicarColaAlDentro } from './porteriaCola';
import { guardarDentro, leerCola, leerDentroGuardado } from './porteriaMemoria';
import { personaNuevaLocal } from './porteriaLookupLocal';
import { conTope, hayRed, TOPE_DENTRO_MS } from './porteriaTiemposRed';

/**
 * Traigo la lista sin clavar la portería si la red está lenta.
 */
export async function listarDentroPorteria(sedeId: number): Promise<AccesoDentroItem[]> {
  const cola = await leerCola();
  let base: AccesoDentroItem[] = [];
  if (hayRed()) {
    try {
      base = await conTope(apiService.accesoListDentro(sedeId), TOPE_DENTRO_MS);
      await guardarDentro(sedeId, base);
    } catch {
      base = await leerDentroGuardado(sedeId);
    }
  } else {
    base = await leerDentroGuardado(sedeId);
  }
  return aplicarColaAlDentro(base, cola, sedeId, personaNuevaLocal);
}
