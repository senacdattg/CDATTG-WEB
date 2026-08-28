/**
 * @module pages/lms/LmsActividadCard
 * @description Tarjeta: título, descripción, plazo e instructor.
 * @author Cristian Deysdayr Jiménez
 */
import { Link } from 'react-router-dom';
import { lmsPaths } from '../../routes/paths';
import { formatFechaHoraVista } from '../../utils/formatFecha';
import { estadoPlazo, labelEstadoPlazo } from './lmsActividadEstado';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividad: LmsActividadItem;
  verMasTo?: string;
  onVer?: (actividadId: number) => void;
}>;

const BADGE: Record<string, string> = {
  vencida: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  por_vencer: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  en_plazo: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  sin_plazo: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

/**
 * Publicación del aula. El instructor abre la vista en pendientes.
 */
export function LmsActividadCard({ fichaId, actividad, verMasTo, onVer }: Props) {
  const estado = estadoPlazo(actividad.plazo_entrega);
  const badge = labelEstadoPlazo(estado);
  const cuerpo = (
    <>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{actividad.titulo}</h3>
        {badge ? (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[estado] ?? ''}`}>{badge}</span>
        ) : null}
      </header>
      {actividad.cuerpo ? (
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">{actividad.cuerpo}</p>
      ) : null}
      <footer className="mt-3 space-y-1 text-xs text-gray-500">
        <p>
          {actividad.plazo_entrega
            ? `Plazo: ${formatFechaHoraVista(actividad.plazo_entrega)}`
            : 'Sin fecha de vencimiento'}
        </p>
        <p>Instructor: {actividad.instructor_nombre?.trim() || '—'}</p>
        <p>{actividad.calificacion_max ?? 100} puntos</p>
      </footer>
    </>
  );
  if (verMasTo) {
    return (
      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-gray-800">
        {cuerpo}
        <Link to={verMasTo} className="btn-secondary mt-4 inline-flex text-sm">
          Ver más
        </Link>
      </article>
    );
  }
  if (onVer) {
    return (
      <article>
        <button
          type="button"
          className="block w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-primary-400 dark:border-gray-600 dark:bg-gray-800"
          onClick={() => onVer(actividad.id)}
        >
          {cuerpo}
        </button>
      </article>
    );
  }
  return (
    <article>
      <Link
        to={lmsPaths.actividad(fichaId, actividad.id)}
        className="block overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-400 dark:border-gray-600 dark:bg-gray-800"
      >
        {cuerpo}
      </Link>
    </article>
  );
}
