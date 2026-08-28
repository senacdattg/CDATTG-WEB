/**
 * @module pages/lms/LmsAuditoriaFilaVista
 * @description Una fila de la tabla de auditoría (como en Aprendices).
 * @author Cristian Deysdayr Jiménez
 */
import { Link } from 'react-router-dom';
import { lmsPaths } from '../../routes/paths';
import type { LmsAuditoriaFila } from '../../types/lmsAuditoria';

type Props = Readonly<{ item: LmsAuditoriaFila; indice: number }>;

/**
 * Muestra nombre, cédula, ficha y el Ver más hacia la carpeta raíz.
 */
export function LmsAuditoriaFilaVista({ item, indice }: Props) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{indice}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
        {item.nombre || '—'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.documento || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.numero_ficha || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.programa || '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.regional || '—'}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded px-2 py-1 text-xs ${
            item.estado
              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {item.estado ? 'ACTIVO' : 'INACTIVO'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link to={lmsPaths.auditoriaPersona(item.persona_id)} className="btn-secondary inline-flex text-sm">
          Ver más
        </Link>
      </td>
    </tr>
  );
}
