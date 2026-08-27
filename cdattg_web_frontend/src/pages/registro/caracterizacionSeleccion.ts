/**
 * @module pages/registro/caracterizacionSeleccion
 * @description Selección de categorías (NINGUNA exclusiva) y valor enviado al API.
 * @author Cristian Deysdayr Jiménez
 */

type Catalogo = Readonly<{ id: number; name: string }>;

/**
 * Identificador de la opción NINGUNA, si existe en el catálogo.
 * @param items Categorías cargadas.
 * @returns Id o undefined.
 */
export function idNinguna(items: readonly Catalogo[]): number | undefined {
  return items.find((c) => c.name.trim().toUpperCase() === 'NINGUNA')?.id;
}

/**
 * Alterna una categoría. Marcar NINGUNA deja solo esa opción.
 * @param ids Selección actual.
 * @param id Categoría pulsada.
 * @param ningunaId Id de NINGUNA, si aplica.
 * @returns Nueva lista de ids.
 * @example alternarCaracterizacion([1], 2, 99) // [1, 2]
 */
export function alternarCaracterizacion(ids: readonly number[], id: number, ningunaId?: number): number[] {
  if (ningunaId != null && id === ningunaId) {
    return ids.includes(ningunaId) ? [] : [ningunaId];
  }
  const sinNinguna = ids.filter((x) => x !== ningunaId);
  if (sinNinguna.includes(id)) {
    return sinNinguna.filter((x) => x !== id);
  }
  return [...sinNinguna, id];
}

/**
 * El API acepta un solo parametro_id; se envía el primero marcado.
 * @param ids Categorías seleccionadas.
 * @returns Id a persistir o 0 si no hay selección.
 */
export function parametroIdDesdeChecks(ids: readonly number[]): number {
  return ids[0] ?? 0;
}
