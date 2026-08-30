/**
 * @module pages/lms/LmsAulaMisActividades
 * @description Lista o pantalla completa de ver, editar o confirmar el borrado.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { LmsEntregaExito, type LmsAvisoEntrega } from './LmsEntregaExito';
import { LmsMisActividadFila } from './LmsMisActividadFila';
import { LmsMisPanelVista } from './LmsMisPanelVista';
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
 * Texto de lista vacía: el instructor publica; el superadmin solo mira.
 * @param {boolean} soloLectura Si no puede publicar.
 * @returns {string} Mensaje visible.
 */
function lmsMisVacioMensaje(soloLectura: boolean): string {
  if (soloLectura) return 'Aún no hay actividades en esta aula.';
  return 'Aún no ha publicado actividades en esta aula.';
}

/**
 * Borra y avisa; si falla dejo el error en pantalla.
 */
async function lmsBorrarActividadMis(
  id: number,
  onEliminar: (actividadId: number) => Promise<void>,
  cerrar: () => void,
  setError: (msg: string) => void,
  setAviso: (v: LmsAvisoEntrega | null) => void,
): Promise<void> {
  setError('');
  try {
    await onEliminar(id);
    cerrar();
    encenderAvisoEntrega('eliminada', setAviso);
  } catch (cause: unknown) {
    setError(cause instanceof Error ? cause.message : 'No se pudo eliminar');
  }
}

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

  return (
    <>
      <LmsEntregaExito visible={Boolean(aviso)} variante={aviso ?? 'exito'} />
      {panel && actual ? (
        <LmsMisPanelVista
          fichaId={fichaId}
          panel={panel}
          actividad={actual}
          saving={saving}
          soloLectura={soloLectura}
          error={error}
          onCerrar={cerrar}
          onEditar={() => setPanel({ modo: 'editar', id: actual.id })}
          onGuardar={async (body) => {
            await onEditar(actual.id, body);
            cerrar();
            encenderAvisoEntrega('actualizada', setAviso);
          }}
          onConfirmarBorrar={() => lmsBorrarActividadMis(actual.id, onEliminar, cerrar, setError, setAviso)}
        />
      ) : (
        <LmsMisActividadesLista
          actividades={actividades}
          soloLectura={soloLectura}
          onVer={(id) => setPanel({ modo: 'ver', id })}
          onEditar={(id) => setPanel({ modo: 'editar', id })}
          onEliminar={(id) => setPanel({ modo: 'borrar', id })}
        />
      )}
    </>
  );
}

type ListaProps = Readonly<{
  actividades: LmsActividadItem[];
  soloLectura: boolean;
  onVer: (id: number) => void;
  onEditar: (id: number) => void;
  onEliminar: (id: number) => void;
}>;

/**
 * Lista de publicaciones o el aviso de aula vacía.
 */
function LmsMisActividadesLista({ actividades, soloLectura, onVer, onEditar, onEliminar }: ListaProps) {
  if (actividades.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        {lmsMisVacioMensaje(soloLectura)}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {actividades.map((a) => (
        <li key={a.id}>
          <LmsMisActividadFila
            actividad={a}
            onVer={() => onVer(a.id)}
            onEditar={soloLectura ? undefined : () => onEditar(a.id)}
            onEliminar={soloLectura ? undefined : () => onEliminar(a.id)}
          />
        </li>
      ))}
    </ul>
  );
}
