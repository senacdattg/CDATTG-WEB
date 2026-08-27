/**
 * @module pages/lms/LmsActividadAlumno
 * @description Mi trabajo: adjuntar, entregar, deshacer y editar.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useState } from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { downloadLmsEntregaArchivo } from '../../services/lmsApi';
import { etiquetaEntregaAlumno } from './lmsActividadEstado';
import { mensajeArchivosFueraDeLimite } from './lmsArchivoLimite';
import { LmsEntregaExito } from './LmsEntregaExito';
import { mostrarToastEntregaExitosa } from './lmsToast';
import type { LmsActividadDetalle } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  detalle: LmsActividadDetalle;
  saving: boolean;
  onEntregar: (files: File[]) => Promise<void>;
  onDeshacer: () => Promise<void>;
}>;

/**
 * Zona de entrega del aprendiz. Acciones apiladas en móvil.
 */
export function LmsActividadAlumno({ fichaId, detalle, saving, onEntregar, onDeshacer }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const mia = detalle.mi_entrega;
  const entregada = Boolean(mia?.entregado_en);
  const puntos = detalle.calificacion_max ?? 100;
  const etiqueta = etiquetaEntregaAlumno(detalle.plazo_entrega);

  async function enviar() {
    setError('');
    const limite = mensajeArchivosFueraDeLimite(files);
    if (limite) {
      setError(limite);
      return;
    }
    const tieneAdjunto = files.length > 0 || Boolean(mia?.archivos?.length);
    if (tieneAdjunto) {
      try {
        await onEntregar(files);
        setFiles([]);
        setExito(true);
        mostrarToastEntregaExitosa();
        globalThis.setTimeout(() => setExito(false), 1800);
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : 'No se pudo entregar');
      }
      return;
    }
    setError('Adjunte al menos un archivo');
  }

  return (
    <section className="space-y-4">
      <LmsEntregaExito visible={exito} />
      <header>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mi trabajo</h2>
      </header>
      <LmsArchivosEntrega fichaId={fichaId} actividadId={detalle.id} mia={mia} />
      {typeof mia?.calificacion === 'number' ? (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Nota: {mia.calificacion} / {puntos}
        </p>
      ) : null}
      {mia?.comentario_instructor ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Comentario del instructor: {mia.comentario_instructor}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {entregada ? (
        <footer>
          <button type="button" className="btn-secondary w-full sm:w-auto" disabled={saving} onClick={() => void onDeshacer()}>
            Deshacer entrega
          </button>
        </footer>
      ) : (
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="btn-secondary inline-flex w-full cursor-pointer items-center justify-center gap-2 sm:w-auto">
            <PaperClipIcon className="h-4 w-4" aria-hidden />
            {mia?.archivos?.length ? 'Reemplazar o agregar archivo' : 'Adjuntar'}
            <input type="file" multiple className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
          </label>
          <button type="button" className="btn-primary w-full sm:w-auto" disabled={saving} onClick={() => void enviar()}>
            {etiqueta}
          </button>
        </footer>
      )}
      {files.length > 0 ? <p className="text-xs text-gray-500">{files.map((f) => f.name).join(', ')}</p> : null}
    </section>
  );
}

function LmsArchivosEntrega({
  fichaId,
  actividadId,
  mia,
}: Readonly<{ fichaId: number; actividadId: number; mia: LmsActividadDetalle['mi_entrega'] }>) {
  if (mia?.archivos?.length) {
    return (
      <ul className="space-y-1 text-sm">
        {mia.archivos.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="text-primary-700 hover:underline dark:text-primary-300"
              onClick={() => void downloadLmsEntregaArchivo(fichaId, actividadId, mia.id, a.id, a.nombre)}
            >
              {a.nombre}
            </button>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm italic text-gray-500">Aún no ha adjuntado archivos.</p>;
}
