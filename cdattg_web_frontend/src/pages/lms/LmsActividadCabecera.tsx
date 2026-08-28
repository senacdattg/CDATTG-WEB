/**
 * @module pages/lms/LmsActividadCabecera
 * @description Título, plazo, instructor, archivos y puntos de la actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { formatFechaHoraVista } from '../../utils/formatFecha';
import { downloadLmsArchivo } from '../../services/lmsApi';
import type { LmsActividadDetalle } from '../../types/lms';

type Props = Readonly<{ fichaId: number; detalle: LmsActividadDetalle }>;

/**
 * Encabezado semántico de la vista de actividad.
 */
export function LmsActividadCabecera({ fichaId, detalle }: Props) {
  const vencida = detalle.plazo_entrega ? new Date(detalle.plazo_entrega).getTime() < Date.now() : false;
  const plazo = detalle.plazo_entrega
    ? `Vence el ${formatFechaHoraVista(detalle.plazo_entrega)}`
    : 'Sin fecha de vencimiento';
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{detalle.titulo}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {plazo}
          {vencida ? ' · Fuera de plazo' : ''}
        </p>
        <p className="mt-1 text-sm text-gray-500">Instructor: {detalle.instructor_nombre?.trim() || '—'}</p>
        {detalle.archivos?.map((a) => (
          <button
            key={a.id}
            type="button"
            className="mt-2 block text-sm text-primary-700 hover:underline dark:text-primary-300"
            onClick={() => void downloadLmsArchivo(fichaId, detalle.id, a.id, a.nombre)}
          >
            {a.nombre}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <span className="block text-xs uppercase tracking-wide text-gray-400">Puntos</span>
        {detalle.calificacion_max ?? 100} puntos posibles
      </p>
    </header>
  );
}
