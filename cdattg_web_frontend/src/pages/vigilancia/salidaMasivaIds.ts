/**
 * Calculo quién sale y quién se queda en la salida masiva.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoDentroItem } from '../../types';

/**
 * Quito de la lista a quienes el vigilante marcó para dejar adentro.
 * @param ids visitas abiertas
 * @param excluir visitas que no se cierran
 * @returns visitas que sí se cierran
 */
export function visitasACerrar(ids: number[], excluir: ReadonlySet<number>): number[] {
  return ids.filter((id) => !excluir.has(id));
}

/**
 * Marco o desmarco una visita para dejarla adentro.
 */
export function toggleExcluir(excluir: ReadonlySet<number>, id: number): Set<number> {
  const next = new Set(excluir);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/**
 * Filtro por nombre o documento para hallar a alguien rápido.
 */
export function filtrarDentro(items: AccesoDentroItem[], q: string): AccesoDentroItem[] {
  const n = q.trim().toLowerCase();
  if (!n) return items;
  return items.filter((it) => {
    const nombre = (it.persona.nombre_completo || '').toLowerCase();
    const doc = (it.persona.numero_documento || '').toLowerCase();
    return nombre.includes(n) || doc.includes(n);
  });
}
