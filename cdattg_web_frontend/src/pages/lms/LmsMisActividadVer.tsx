/**
 * @module pages/lms/LmsMisActividadVer
 * @description Lectura a ancho completo en pendientes o en Mis actividades.
 * @author Cristian Deysdayr Jiménez
 */
import { formatFechaHoraVista } from '../../utils/formatFecha';
import { LmsArchivosPublicacion } from './LmsArchivosPublicacion';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividad: LmsActividadItem;
  onCerrar: () => void;
  onEditar?: () => void;
}>;

/**
 * Título, descripción, plazo y PDFs. Editar pasa a Mis actividades.
 */
export function LmsMisActividadVer({ fichaId, actividad, onCerrar, onEditar }: Props) {
  return (
    <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-2xl font-bold text-gray-900 dark:text-white">{actividad.titulo}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {actividad.plazo_entrega ? `Plazo: ${formatFechaHoraVista(actividad.plazo_entrega)}` : 'Sin fecha de vencimiento'}
          </p>
          <p className="text-sm text-gray-500">{actividad.calificacion_max ?? 100} puntos</p>
        </div>
        <button type="button" className="btn-secondary w-full shrink-0 sm:w-auto" onClick={onCerrar}>
          Volver
        </button>
      </header>
      <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
        {actividad.cuerpo?.trim() ? actividad.cuerpo : 'Sin descripción.'}
      </p>
      <LmsArchivosPublicacion fichaId={fichaId} actividadId={actividad.id} archivos={actividad.archivos} />
      {onEditar ? (
        <aside className="border-t border-gray-100 pt-4 dark:border-gray-700">
          <p className="mb-2 text-sm font-medium text-gray-800 dark:text-gray-200">Editar</p>
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={onEditar}>
            Editar actividad
          </button>
        </aside>
      ) : null}
    </section>
  );
}
