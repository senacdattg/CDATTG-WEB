/**
 * @module pages/lms/LmsMisActividadEditar
 * @description Edición a ancho completo; Ver y Eliminar no se ven.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsArchivosPublicacion } from './LmsArchivosPublicacion';
import { LmsPublicarActividadForm } from './LmsPublicarActividadForm';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividad: LmsActividadItem;
  saving: boolean;
  onGuardar: (body: FormData) => Promise<void>;
  onCerrar: () => void;
}>;

/**
 * Formulario amplio. Cancelar vuelve a la lista.
 */
export function LmsMisActividadEditar({ fichaId, actividad, saving, onGuardar, onCerrar }: Props) {
  return (
    <div className="space-y-4">
      <LmsArchivosPublicacion fichaId={fichaId} actividadId={actividad.id} archivos={actividad.archivos} />
      <LmsPublicarActividadForm saving={saving} initial={actividad} onSubmit={onGuardar} onCancel={onCerrar} />
    </div>
  );
}
