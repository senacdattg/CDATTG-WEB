/**
 * @module pages/lms/LmsAulaTablon
 * @description Tablón: guías y publicaciones que el aprendiz debe ver.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsActividadCard } from './LmsActividadCard';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{ fichaId: number; actividades: LmsActividadItem[] }>;

/**
 * Lista todas las publicaciones (el tablón es el feed del aula).
 */
export function LmsAulaTablon({ fichaId, actividades }: Props) {
  if (actividades.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        Aún no hay publicaciones en el tablón.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {actividades.map((a) => (
        <li key={a.id}>
          <LmsActividadCard fichaId={fichaId} actividad={a} />
        </li>
      ))}
    </ul>
  );
}
