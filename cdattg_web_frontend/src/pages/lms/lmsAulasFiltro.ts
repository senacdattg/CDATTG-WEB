/**
 * @module pages/lms/lmsAulasFiltro
 * @description Filtro de Mis aulas por tipo, ficha o programa.
 * @author Cristian Deysdayr Jiménez
 */
import type { TipoFormacion } from '../../constants/tipoFormacion';
import type { LmsAulaListItem } from '../../types/lms';

export type LmsFiltroTipo = 'TODOS' | TipoFormacion;

/**
 * Indica si el aula coincide con el texto (ficha o nombre de programa).
 * @param aula Aula listada.
 * @param q Texto escrito por el usuario.
 */
export function aulaCoincideBusqueda(aula: LmsAulaListItem, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const ficha = (aula.numero_ficha || '').toLowerCase();
  const programa = (aula.nombre_programa || '').toLowerCase();
  return ficha.includes(t) || programa.includes(t);
}

/**
 * Indica si el aula es del tipo de formación elegido.
 * @param aula Aula listada.
 * @param filtro Chip activo.
 */
export function aulaCoincideTipo(aula: LmsAulaListItem, filtro: LmsFiltroTipo): boolean {
  if (filtro === 'TODOS') return true;
  return (aula.tipo_formacion || 'FORMACION_REGULAR') === filtro;
}

/**
 * Aulas visibles según chip de tipo y búsqueda.
 * @param aulas Catálogo del usuario.
 * @param filtro Tipo de formación.
 * @param q Ficha o programa.
 */
export function filtrarAulas(aulas: LmsAulaListItem[], filtro: LmsFiltroTipo, q: string): LmsAulaListItem[] {
  return aulas.filter((a) => aulaCoincideBusqueda(a, q) && aulaCoincideTipo(a, filtro));
}
