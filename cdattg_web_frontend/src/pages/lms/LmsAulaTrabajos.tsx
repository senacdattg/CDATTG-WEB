/**
 * @module pages/lms/LmsAulaTrabajos
 * @description Trabajos de clase: los que el aprendiz ya entregó.
 * @author Cristian Deysdayr Jiménez
 */
import { actividadesEntregadas } from './lmsActividadFiltro';
import { LmsActividadCard } from './LmsActividadCard';
import { lmsPaths } from '../../routes/paths';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividades: LmsActividadItem[];
  puedePublicar: boolean;
}>;

/**
 * Muestra entregas. El instructor abre Ver más para ver a cada aprendiz.
 */
export function LmsAulaTrabajos({ fichaId, actividades, puedePublicar }: Props) {
  const items = actividadesEntregadas(actividades, puedePublicar);
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        {puedePublicar ? 'Aún no hay trabajos entregados.' : 'Aún no ha entregado trabajos de clase.'}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <LmsActividadCard
            fichaId={fichaId}
            actividad={a}
            verMasTo={puedePublicar ? lmsPaths.actividadAprendices(fichaId, a.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
