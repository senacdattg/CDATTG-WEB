/**
 * @module pages/lms/LmsAulaMisActividades
 * @description Lista o pantalla de ver una actividad mía.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { LmsMisActividadFila } from './LmsMisActividadFila';
import { LmsMisActividadVer } from './LmsMisActividadVer';
import { lmsActividadDePanel, type LmsMisPanel } from './lmsMisPanel';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{ fichaId: number; actividades: LmsActividadItem[] }>;

export function LmsAulaMisActividades({ fichaId, actividades }: Props) {
  const [panel, setPanel] = useState<LmsMisPanel | null>(null);
  const actual = lmsActividadDePanel(actividades, panel);
  if (panel && actual && panel.modo === 'ver') {
    return <LmsMisActividadVer fichaId={fichaId} actividad={actual} onCerrar={() => setPanel(null)} />;
  }
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
          <LmsMisActividadFila actividad={a} onVer={() => setPanel({ modo: 'ver', id: a.id })} />
        </li>
      ))}
    </ul>
  );
}
