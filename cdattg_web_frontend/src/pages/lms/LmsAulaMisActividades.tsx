/**
 * @module pages/lms/LmsAulaMisActividades
 * @description Lista, ver o editar una actividad mía.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { LmsMisActividadEditar } from './LmsMisActividadEditar';
import { LmsMisActividadFila } from './LmsMisActividadFila';
import { LmsMisActividadVer } from './LmsMisActividadVer';
import { lmsActividadDePanel, type LmsMisPanel } from './lmsMisPanel';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividades: LmsActividadItem[];
  saving: boolean;
  onEditar: (actividadId: number, body: FormData) => Promise<void>;
}>;

export function LmsAulaMisActividades({ fichaId, actividades, saving, onEditar }: Props) {
  const [panel, setPanel] = useState<LmsMisPanel | null>(null);
  const actual = lmsActividadDePanel(actividades, panel);
  const cerrar = () => setPanel(null);
  if (panel && actual && panel.modo === 'ver') {
    return <LmsMisActividadVer fichaId={fichaId} actividad={actual} onCerrar={cerrar} />;
  }
  if (panel && actual && panel.modo === 'editar') {
    return (
      <LmsMisActividadEditar
        fichaId={fichaId}
        actividad={actual}
        saving={saving}
        onCerrar={cerrar}
        onGuardar={async (body) => {
          await onEditar(actual.id, body);
          cerrar();
        }}
      />
    );
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
          <LmsMisActividadFila
            actividad={a}
            onVer={() => setPanel({ modo: 'ver', id: a.id })}
            onEditar={() => setPanel({ modo: 'editar', id: a.id })}
            onEliminar={() => undefined}
          />
        </li>
      ))}
    </ul>
  );
}
