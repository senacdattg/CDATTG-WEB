/**
 * @module pages/lms/LmsActividadAlumno
 * @description Mi trabajo: adjuntar PDF, entregar, deshacer y vista previa.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { etiquetaEntregaAlumno } from './lmsActividadEstado';
import { mensajeArchivosFueraDeLimite } from './lmsArchivoLimite';
import { mensajeArchivosNoPdf } from './lmsArchivoPdf';
import { LmsArchivosEntrega } from './LmsArchivosEntrega';
import { LmsActividadAlumnoAcciones } from './LmsActividadAlumnoAcciones';
import { LmsEntregaExito, type LmsAvisoEntrega } from './LmsEntregaExito';
import { LmsPdfLocal } from './LmsPdfLocal';
import { encenderAvisoEntrega } from './lmsToast';
import type { LmsActividadDetalle } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  detalle: LmsActividadDetalle;
  saving: boolean;
  onEntregar: (files: File[]) => Promise<void>;
  onDeshacer: () => Promise<void>;
}>;

/**
 * Zona de entrega del aprendiz. Solo PDF, con vista previa antes de enviar.
 */
export function LmsActividadAlumno({ fichaId, detalle, saving, onEntregar, onDeshacer }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState<LmsAvisoEntrega | null>(null);
  const mia = detalle.mi_entrega;
  const entregada = Boolean(mia?.entregado_en);
  const puntos = detalle.calificacion_max ?? 100;
  const etiqueta = etiquetaEntregaAlumno(detalle.plazo_entrega);
  const puedeEntregar = detalle.puede_entregar !== false;

  function elegir(list: File[]) {
    const msg = mensajeArchivosNoPdf(list) ?? mensajeArchivosFueraDeLimite(list);
    if (msg) {
      setError(msg);
      setFiles([]);
      return;
    }
    setError('');
    setFiles(list);
  }

  async function enviar() {
    setError('');
    const msg = mensajeArchivosNoPdf(files) ?? mensajeArchivosFueraDeLimite(files);
    if (msg) {
      setError(msg);
      return;
    }
    const tieneAdjunto = files.length > 0 || Boolean(mia?.archivos?.length);
    if (!tieneAdjunto) {
      setError('Adjunte al menos un PDF');
      return;
    }
    try {
      await onEntregar(files);
      setFiles([]);
      encenderAvisoEntrega('exito', setAviso);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo entregar');
    }
  }

  async function deshacer() {
    setError('');
    try {
      await onDeshacer();
      encenderAvisoEntrega('deshacer', setAviso);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo deshacer la entrega');
    }
  }

  return (
    <section className="space-y-4">
      <LmsEntregaExito visible={aviso !== null} variante={aviso ?? 'exito'} />
      <header>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mi trabajo</h2>
      </header>
      <LmsArchivosEntrega
        fichaId={fichaId}
        actividadId={detalle.id}
        entregaId={mia?.id ?? 0}
        archivos={mia?.archivos}
        vacio="Aún no ha adjuntado archivos."
      />
      {files.map((f) => (
        <LmsPdfLocal key={`${f.name}-${f.size}-${f.lastModified}`} file={f} />
      ))}
      {typeof mia?.calificacion === 'number' ? (
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Nota: {mia.calificacion} / {puntos}
        </p>
      ) : null}
      {mia?.comentario_instructor ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">Comentario del instructor: {mia.comentario_instructor}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <LmsActividadAlumnoAcciones
        puedeEntregar={puedeEntregar}
        entregada={entregada}
        saving={saving}
        etiqueta={etiqueta}
        tieneArchivos={Boolean(mia?.archivos?.length)}
        onElegir={elegir}
        onEnviar={() => void enviar()}
        onDeshacer={() => void deshacer()}
      />
    </section>
  );
}
