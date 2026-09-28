/**
 * Filtro las personas de biblioteca por la ficha que eligió el usuario.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { CarnetBibliotecaItem } from '../../../types/carnet';

/**
 * Dejo solo los de esa ficha. Sin ficha elegida no muestro a nadie.
 * @param items personas con carnet regular aprobado
 * @param fichaId ficha elegida; 0 = todavía no eligió
 * @returns personas visibles
 */
export function filtrarItemsBiblioteca(items: CarnetBibliotecaItem[], fichaId: number): CarnetBibliotecaItem[] {
  if (fichaId <= 0) {
    return [];
  }
  return items.filter((it) => it.ficha_id === fichaId);
}

export type FiltroListoBiblioteca = 'todos' | 'listos';

/**
 * En Todos salen todos; en Listos solo los que ya tienen chulito.
 */
export function filtrarItemsListo(items: CarnetBibliotecaItem[], filtro: FiltroListoBiblioteca): CarnetBibliotecaItem[] {
  if (filtro === 'listos') {
    return items.filter((it) => it.listo);
  }
  return items;
}
