/**
 * Marco o desmarco todos los de la hoja actual.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoStubItem } from '../../types';

/**
 * Quito o pongo un id en el conjunto.
 */
export function toggleId(prev: ReadonlySet<number>, id: number): Set<number> {
  const n = new Set(prev);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}

/**
 * Ids de la hoja que estoy viendo.
 */
export function idsDeHoja(items: readonly AccesoStubItem[]): number[] {
  return items.map((it) => it.id);
}

/**
 * Si ya están todos, los suelto; si no, los marco.
 */
export function conTodosDeHoja(sel: ReadonlySet<number>, ids: number[]): Set<number> {
  const next = new Set(sel);
  if (hojaTodaMarcada(next, ids)) {
    ids.forEach((id) => next.delete(id));
  } else {
    ids.forEach((id) => next.add(id));
  }
  return next;
}

/**
 * La hoja está toda marcada.
 */
export function hojaTodaMarcada(sel: ReadonlySet<number>, ids: number[]): boolean {
  return ids.length > 0 && ids.every((id) => sel.has(id));
}
