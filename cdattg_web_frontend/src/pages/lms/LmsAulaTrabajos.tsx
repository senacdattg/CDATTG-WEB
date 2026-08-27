/**
 * @module pages/lms/LmsAulaTrabajos
 * @description Trabajos de clase: vencidos o con plazo de entrega.
 * @author Cristian Deysdayr Jiménez
 */
import { actividadesTrabajoClase } from './lmsActividadEstado';
import { LmsActividadCard } from './LmsActividadCard';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{ fichaId: number; actividades: LmsActividadItem[] }>;

/**
 * Muestra actividades con plazo, priorizando vencidas y por vencer.
 */
export function LmsAulaTrabajos({ fichaId, actividades }: Props) {
  const items = actividadesTrabajoClase(actividades);
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        No hay trabajos de clase con plazo de entrega.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <LmsActividadCard fichaId={fichaId} actividad={a} />
        </li>
      ))}
    </ul>
  );
}
