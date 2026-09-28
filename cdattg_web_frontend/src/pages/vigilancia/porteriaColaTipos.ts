/**
 * Tipos de lo que guardo si no hay red: entrada o salida pendiente.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoMetodoRegistro } from '../../types';

export type ColaAccesoItem = {
  id: string;
  tipo: 'INGRESO' | 'SALIDA';
  numero_documento: string;
  sede_id: number;
  metodo_registro: AccesoMetodoRegistro;
  permitir_sin_ingreso?: boolean;
  creado_en: number;
};

/**
 * Armo un id único por movimiento.
 */
export function idColaAcceso(ahora: number): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `p-${ahora}`;
}

export function claveLookup(sedeId: number, doc: string): string {
  return `${sedeId}|${doc}`;
}

/**
 * Dejo el último movimiento de esa cédula en esa sede.
 */
export function ultimoDeDoc(cola: readonly ColaAccesoItem[], sedeId: number, doc: string): ColaAccesoItem | undefined {
  const deEsta = cola.filter((c) => c.sede_id === sedeId && c.numero_documento === doc);
  return deEsta.at(-1);
}
