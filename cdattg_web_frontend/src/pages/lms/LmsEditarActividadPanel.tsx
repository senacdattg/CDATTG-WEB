/**
 * @module pages/lms/LmsEditarActividadPanel
 * @description El instructor abre el formulario para modificar la publicación.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { LmsPublicarActividadForm } from './LmsPublicarActividadForm';
import type { LmsActividadDetalle } from '../../types/lms';

type Props = Readonly<{
  detalle: LmsActividadDetalle;
  saving: boolean;
  onSubmit: (body: FormData) => Promise<void>;
}>;

/**
 * Botón Editar actividad y formulario reutilizado del tablón.
 */
export function LmsEditarActividadPanel({ detalle, saving, onSubmit }: Props) {
  const [abierto, setAbierto] = useState(false);

  /** Cierra el formulario tras guardar. */
  async function guardar(body: FormData) {
    await onSubmit(body);
    setAbierto(false);
  }

  if (!abierto) {
    return (
      <p>
        <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => setAbierto(true)}>
          <PencilSquareIcon className="h-5 w-5" aria-hidden />
          Editar actividad
        </button>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <LmsPublicarActividadForm saving={saving} initial={detalle} onSubmit={guardar} />
      <button type="button" className="btn-secondary" onClick={() => setAbierto(false)}>
        Cancelar
      </button>
    </div>
  );
}
