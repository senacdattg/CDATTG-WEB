/**
 * @module pages/lms/LmsAulaMisActividades
 * @description Lista las actividades que publiqué en el aula.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsMisActividadFila } from './LmsMisActividadFila';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{ actividades: LmsActividadItem[] }>;

export function LmsAulaMisActividades({ actividades }: Props) {
  if (actividades.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        Aún no ha publicado actividades en esta aula.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {actividades.map((a) => (
        <li key={a.id}>
          <LmsMisActividadFila actividad={a} />
        </li>
      ))}
    </ul>
  );
}
