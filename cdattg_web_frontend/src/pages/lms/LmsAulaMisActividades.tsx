/**
 * @module pages/lms/LmsAulaMisActividades
 * @description Lista o pantalla completa de ver, editar o confirmar el borrado.
 * @author Cristian Deysdayr Jiménez
 */
import { useState, type ReactNode } from 'react';
import { LmsEntregaExito, type LmsAvisoEntrega } from './LmsEntregaExito';
import { LmsMisActividadBorrar } from './LmsMisActividadBorrar';
import { LmsMisActividadEditar } from './LmsMisActividadEditar';
import { LmsMisActividadFila } from './LmsMisActividadFila';
import { LmsMisActividadVer } from './LmsMisActividadVer';
import { encenderAvisoEntrega } from './lmsToast';
import { lmsActividadDePanel, type LmsMisPanel } from './lmsMisPanel';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividades: LmsActividadItem[];
  saving: boolean;
  onEditar: (actividadId: number, body: FormData) => Promise<void>;
  onEliminar: (actividadId: number) => Promise<void>;
  panelInicial?: LmsMisPanel | null;
  onCerrarPanel?: () => void;
  soloLectura?: boolean;
}>;

/**
 * Ver y Editar llenan el espacio. Eliminar pide una segunda confirmación.
 */
export function LmsAulaMisActividades({
  fichaId,
  actividades,
  saving,
  onEditar,
  onEliminar,
  panelInicial = null,
  onCerrarPanel,
  soloLectura = false,
}: Props) {
  const [panel, setPanel] = useState<LmsMisPanel | null>(panelInicial);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState<LmsAvisoEntrega | null>(null);
  const actual = lmsActividadDePanel(actividades, panel);
  const cerrar = () => {
    setPanel(null);
    setError('');
    onCerrarPanel?.();
  };

  let vista: ReactNode;
  if (panel && actual && panel.modo === 'ver') {
    vista = (
      <LmsMisActividadVer
        fichaId={fichaId}
        actividad={actual}
        onCerrar={cerrar}
        onEditar={soloLectura ? undefined : () => setPanel({ modo: 'editar', id: actual.id })}
      />
    );
  } else if (panel && actual && panel.modo === 'editar') {
    vista = (
      <LmsMisActividadEditar
        fichaId={fichaId}
        actividad={actual}
        saving={saving}
        onCerrar={cerrar}
        onGuardar={async (body) => {
          await onEditar(actual.id, body);
          cerrar();
          encenderAvisoEntrega('actualizada', setAviso);
        }}
      />
    );
  } else if (panel && actual && panel.modo === 'borrar') {
    vista = (
      <div className="space-y-3">
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        <LmsMisActividadBorrar
          titulo={actual.titulo}
          saving={saving}
          onCancelar={cerrar}
          onConfirmar={async () => {
            setError('');
            try {
              await onEliminar(actual.id);
              cerrar();
              encenderAvisoEntrega('eliminada', setAviso);
            } catch (cause: unknown) {
              setError(cause instanceof Error ? cause.message : 'No se pudo eliminar');
            }
          }}
        />
      </div>
    );
  } else if (actividades.length === 0) {
    vista = (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        {soloLectura ? 'Aún no hay actividades en esta aula.' : 'Aún no ha publicado actividades en esta aula.'}
      </p>
    );
  } else {
    vista = (
      <ul className="space-y-3">
        {actividades.map((a) => (
          <li key={a.id}>
            <LmsMisActividadFila
              actividad={a}
              onVer={() => setPanel({ modo: 'ver', id: a.id })}
              onEditar={soloLectura ? undefined : () => setPanel({ modo: 'editar', id: a.id })}
              onEliminar={soloLectura ? undefined : () => setPanel({ modo: 'borrar', id: a.id })}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <LmsEntregaExito visible={Boolean(aviso)} variante={aviso ?? 'exito'} />
      {vista}
    </>
  );
}
