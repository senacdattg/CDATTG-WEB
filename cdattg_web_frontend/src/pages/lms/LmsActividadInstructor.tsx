/**
 * @module pages/lms/LmsActividadInstructor
 * @description Listado de aprendices de una actividad, con Ver actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { Link } from 'react-router-dom';
import { lmsPaths } from '../../routes/paths';
import { labelEstadoEntrega } from './lmsActividadEstado';
import type { LmsActividadDetalle } from '../../types/lms';

type Props = Readonly<{ fichaId: number; detalle: LmsActividadDetalle }>;

/**
 * Todos los aprendices. Ver actividad abre lo que subió y la nota.
 */
export function LmsActividadInstructor({ fichaId, detalle }: Props) {
  if (detalle.entregas.length === 0) {
    return <p className="text-sm text-gray-500">No hay aprendices en esta ficha.</p>;
  }
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
      {detalle.entregas.map((e) => (
        <li key={e.aprendiz_id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{e.aprendiz_nombre || '—'}</h3>
            <p className="text-xs text-gray-500">{e.documento || '—'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {labelEstadoEntrega(e.entregado_en, e.tardia)}
            </p>
          </div>
          <Link to={lmsPaths.actividadEntrega(fichaId, detalle.id, e.aprendiz_id)} className="btn-secondary text-sm">
            Ver actividad
          </Link>
        </li>
      ))}
    </ul>
  );
}
