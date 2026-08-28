/**
 * @module pages/lms/lmsAuditoriaPagina
 * @description Tamaño de página y total de páginas de las carpetas raíz.
 * @author Cristian Deysdayr Jiménez
 */

export const LMS_AUDITORIA_PAGE_SIZE = 20;

/**
 * Cuántas páginas hay con 20 carpetas por página.
 * @param {number} total Cuántas personas hay.
 * @returns {number} Al menos 1.
 */
export function lmsTotalPaginas(total: number): number {
  if (total <= 0) return 1;
  return Math.ceil(total / LMS_AUDITORIA_PAGE_SIZE);
}
