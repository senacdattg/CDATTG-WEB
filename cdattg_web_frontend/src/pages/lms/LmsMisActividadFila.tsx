/**
 * @module pages/lms/LmsMisActividadFila
 * @description Tarjeta compacta: Ver, Editar y Eliminar a ancho completo.
 * @author Cristian Deysdayr Jiménez
 */
import { formatFechaHoraVista } from '../../utils/formatFecha';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  actividad: LmsActividadItem;
  onVer: () => void;
  onEditar?: () => void;
  onEliminar?: () => void;
}>;

/**
 * En el celular los tres botones van uno bajo el otro.
 */
export function LmsMisActividadFila({ actividad, onVer, onEditar, onEliminar }: Props) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800 sm:p-5">
      <h3 className="break-words text-lg font-semibold text-gray-900 dark:text-white">{actividad.titulo}</h3>
      <p className="mt-1 text-sm text-gray-500">
        {actividad.plazo_entrega ? `Plazo: ${formatFechaHoraVista(actividad.plazo_entrega)}` : 'Sin fecha de vencimiento'}
      </p>
      <p className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button type="button" className="btn-secondary w-full" onClick={onVer}>
          Ver
        </button>
        {onEditar ? (
          <button type="button" className="btn-secondary w-full" onClick={onEditar}>
            Editar
          </button>
        ) : null}
        {onEliminar ? (
          <button type="button" className="btn-secondary w-full text-red-700 dark:text-red-300" onClick={onEliminar}>
            Eliminar
          </button>
        ) : null}
      </p>
    </article>
  );
}
