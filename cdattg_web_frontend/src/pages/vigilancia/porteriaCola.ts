/**
 * Aplico la cola local al lookup y a la lista de adentro.
 *
 * Lo hice para que, sin red, se vea si alguien ya “entró” aquí aunque el servidor no lo sepa.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoDentroItem, AccesoLookupResponse, AccesoPersonaFicha } from '../../types';
import { ultimoDeDoc, type ColaAccesoItem } from './porteriaColaTipos';

/**
 * Si hay entrada o salida pendiente, el lookup respeta ese último paso.
 */
export function aplicarColaAlLookup(lookup: AccesoLookupResponse, cola: readonly ColaAccesoItem[]): AccesoLookupResponse {
  const u = ultimoDeDoc(cola, lookup.sede_id, lookup.persona.numero_documento);
  if (!u) return lookup;
  const dentro = u.tipo === 'INGRESO';
  return {
    ...lookup,
    dentro,
    accion_sugerida: dentro ? 'SALIDA' : 'INGRESO',
    permite_salida_sin_ingreso: dentro ? false : lookup.permite_salida_sin_ingreso,
  };
}

/**
 * Sumo entradas pendientes y quito salidas pendientes de la lista.
 */
export function aplicarColaAlDentro(
  lista: readonly AccesoDentroItem[],
  cola: readonly ColaAccesoItem[],
  sedeId: number,
  fichaDe: (doc: string) => AccesoPersonaFicha,
): AccesoDentroItem[] {
  const deSede = cola.filter((c) => c.sede_id === sedeId);
  let out = [...lista];
  for (const c of deSede) {
    if (c.tipo === 'INGRESO') {
      if (out.some((i) => i.persona.numero_documento === c.numero_documento)) continue;
      out.push({
        visita_id: 0,
        persona: fichaDe(c.numero_documento),
        tipo_persona: 'VISITANTE',
        timestamp_entrada: new Date(c.creado_en).toISOString(),
        metodo_registro: c.metodo_registro,
      });
    } else {
      out = out.filter((i) => i.persona.numero_documento !== c.numero_documento);
    }
  }
  return out;
}
