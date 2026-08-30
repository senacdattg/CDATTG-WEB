/**
 * @module pages/lms/LmsMisPanelVista
 * @description Ver, editar o confirmar el borrado de una actividad.
 * Lo saqué de LmsAulaMisActividades para bajar la complejidad.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsMisActividadBorrar } from './LmsMisActividadBorrar';
import { LmsMisActividadEditar } from './LmsMisActividadEditar';
import { LmsMisActividadVer } from './LmsMisActividadVer';
import type { LmsMisPanel } from './lmsMisPanel';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  panel: LmsMisPanel;
  actividad: LmsActividadItem;
  saving: boolean;
  soloLectura: boolean;
  error: string;
  onCerrar: () => void;
  onEditar: () => void;
  onGuardar: (body: FormData) => Promise<void>;
  onConfirmarBorrar: () => Promise<void>;
}>;

/**
 * Una pantalla a la vez. La lista vive en LmsAulaMisActividades.
 */
export function LmsMisPanelVista({
  fichaId,
  panel,
  actividad,
  saving,
  soloLectura,
  error,
  onCerrar,
  onEditar,
  onGuardar,
  onConfirmarBorrar,
}: Props) {
  if (panel.modo === 'ver') {
    return (
      <LmsMisActividadVer
        fichaId={fichaId}
        actividad={actividad}
        onCerrar={onCerrar}
        onEditar={soloLectura ? undefined : onEditar}
      />
    );
  }
  if (panel.modo === 'editar') {
    return (
      <LmsMisActividadEditar
        fichaId={fichaId}
        actividad={actividad}
        saving={saving}
        onCerrar={onCerrar}
        onGuardar={onGuardar}
      />
    );
  }
  return (
    <div className="space-y-3">
      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      <LmsMisActividadBorrar
        titulo={actividad.titulo}
        saving={saving}
        onCancelar={onCerrar}
        onConfirmar={onConfirmarBorrar}
      />
    </div>
  );
}
