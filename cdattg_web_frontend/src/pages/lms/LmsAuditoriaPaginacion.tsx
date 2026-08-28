/**
 * @module pages/lms/LmsAuditoriaPaginacion
 * @description Anterior / Siguiente de las carpetas raíz (20 por página).
 * @author Cristian Deysdayr Jiménez
 */
import { lmsTotalPaginas, LMS_AUDITORIA_PAGE_SIZE } from './lmsAuditoriaPagina';

type Props = Readonly<{
  page: number;
  total: number;
  onPage: (p: number) => void;
}>;

/**
 * Lo pongo debajo de las carpetas. Solo se ve si hay más de 20.
 */
export function LmsAuditoriaPaginacion({ page, total, onPage }: Props) {
  const totalPages = lmsTotalPaginas(total);
  if (totalPages <= 1) return null;
  const desde = (page - 1) * LMS_AUDITORIA_PAGE_SIZE + 1;
  const hasta = Math.min(page * LMS_AUDITORIA_PAGE_SIZE, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando {desde} a {hasta} de {total} carpetas
      </p>
      <p className="flex gap-2">
        <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          Siguiente
        </button>
      </p>
    </div>
  );
}
