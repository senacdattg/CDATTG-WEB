/**
 * @module pages/lms/LmsEntregaFila
 * @description Una entrega de aprendiz: archivos, nota 0-100 y comentario.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { LmsArchivosEntrega } from './LmsArchivosEntrega';
import { labelEstadoEntrega } from './lmsActividadEstado';
import type { LmsEntregaItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividadId: number;
  puntos: number;
  entrega: LmsEntregaItem;
  saving: boolean;
  onCalificar: (entregaId: number, nota: number | null, comentario: string) => Promise<void>;
}>;

/**
 * Revisión de un envío. El formulario solo aparece si ya entregó.
 */
export function LmsEntregaFila({ fichaId, actividadId, puntos, entrega, saving, onCalificar }: Props) {
  const notaInicial = typeof entrega.calificacion === 'number' ? String(entrega.calificacion) : '';
  const [nota, setNota] = useState(notaInicial);
  const [comentario, setComentario] = useState(entrega.comentario_instructor || '');
  const [error, setError] = useState('');
  const entrego = entrega.id > 0 && Boolean(entrega.entregado_en);
  const notaId = `lms-nota-${entrega.aprendiz_id}`;
  const comId = `lms-com-${entrega.aprendiz_id}`;

  async function guardar() {
    setError('');
    const n = nota.trim() === '' ? null : Number(nota);
    if (n != null && (Number.isNaN(n) || n < 0 || n > puntos)) {
      setError(`La nota debe estar entre 0 y ${puntos}`);
      return;
    }
    try {
      await onCalificar(entrega.id, n, comentario);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }

  return (
    <article className="space-y-3">
      <header>
        <h3 className="font-medium text-gray-900 dark:text-white">{entrega.aprendiz_nombre || '—'}</h3>
        <p className="text-xs text-gray-500">{entrega.documento || '—'}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{labelEstadoEntrega(entrega.entregado_en, entrega.tardia)}</p>
      </header>
      <LmsArchivosEntrega
        fichaId={fichaId}
        actividadId={actividadId}
        entregaId={entrega.id}
        archivos={entrega.archivos}
        vacio="Sin archivos."
      />
      {entrego ? (
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <p className="sm:col-span-2">
            <label htmlFor={notaId} className="mb-1 block text-sm">
              Nota (0-{puntos})
            </label>
            <input
              id={notaId}
              className="input-field"
              type="number"
              min={0}
              max={puntos}
              step={0.1}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </p>
          <p className="sm:col-span-2">
            <label htmlFor={comId} className="mb-1 block text-sm">
              Comentario
            </label>
            <textarea
              id={comId}
              className="input-field"
              rows={2}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </p>
          {error ? <p className="text-sm text-red-600 sm:col-span-2">{error}</p> : null}
          <button type="submit" className="btn-primary sm:col-span-2" disabled={saving}>
            Guardar nota
          </button>
        </form>
      ) : null}
    </article>
  );
}
