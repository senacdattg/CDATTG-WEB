/**
 * @module pages/lms/LmsMisActividadFila
 * @description Tarjeta de una actividad mía en el aula.
 * @author Cristian Deysdayr Jiménez
 */
import { formatFechaHoraVista } from '../../utils/formatFecha';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{ actividad: LmsActividadItem; onVer: () => void }>;

export function LmsMisActividadFila({ actividad, onVer }: Props) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800 sm:p-5">
      <h3 className="break-words text-lg font-semibold text-gray-900 dark:text-white">{actividad.titulo}</h3>
      <p className="mt-1 text-sm text-gray-500">
        {actividad.plazo_entrega ? `Plazo: ${formatFechaHoraVista(actividad.plazo_entrega)}` : ''}
      </p>
      <p className="mt-4">
        <button type="button" className="btn-secondary w-full" onClick={onVer}>
          Ver
        </button>
      </p>
    </article>
  );
}
