/**
 * @module pages/lms/LmsAuditoriaCarpeta
 * @description Tarjeta de carpeta (raíz, tipo o ficha) en auditoría.
 * @author Cristian Deysdayr Jiménez
 */
import { Link } from 'react-router-dom';
import { FolderIcon } from '@heroicons/react/24/outline';

type Props = Readonly<{
  titulo: string;
  detalle?: string;
  to?: string;
  onVerMas?: () => void;
}>;

/**
 * Carpeta con Ver más. Lo uso en el listado y en los tres tipos.
 */
export function LmsAuditoriaCarpeta({ titulo, detalle, to, onVerMas }: Props) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start gap-3">
        <FolderIcon className="h-10 w-10 shrink-0 text-amber-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">{titulo}</h2>
          {detalle ? <p className="mt-1 text-sm text-gray-500">{detalle}</p> : null}
        </div>
      </div>
      {to ? (
        <Link to={to} className="btn-secondary mt-4 inline-flex text-sm">
          Ver más
        </Link>
      ) : null}
      {onVerMas ? (
        <button type="button" onClick={onVerMas} className="btn-secondary mt-4 inline-flex text-sm">
          Ver más
        </button>
      ) : null}
    </article>
  );
}
