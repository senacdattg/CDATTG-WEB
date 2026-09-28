/**
 * Cuento cuántos carnets de cada ficha ya están listos.
 * Lo pongo en el select para no entrar ficha por ficha.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { CarnetBibliotecaItem } from '../../../types/carnet';

export type AvanceFichaListo = { listos: number; total: number };

/**
 * Cuento listos y total de una ficha.
 */
export function avanceListoDeFicha(items: CarnetBibliotecaItem[], fichaId: number): AvanceFichaListo {
  const deFicha = items.filter((it) => it.ficha_id === fichaId);
  return { total: deFicha.length, listos: deFicha.filter((it) => it.listo).length };
}

/**
 * Armo el texto 1/5 · 20% para el filtro.
 */
export function etiquetaAvanceListo(avance: AvanceFichaListo): string {
  if (avance.total === 0) {
    return '0/0';
  }
  const pct = Math.round((avance.listos / avance.total) * 100);
  return `${avance.listos}/${avance.total} · ${pct}%`;
}
