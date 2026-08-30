/**
 * @module pages/lms/LmsPublicarActividadForm
 * @description Publicar o editar: título, descripción, puntos, archivos y plazo.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';
import { LmsPublicarArchivos, LmsPublicarPlazo, LmsPublicarPuntos } from './LmsPublicarCampos';
import { LmsPublicarVistaPrevia } from './LmsPublicarVistaPrevia';
import { LmsEntregaExito, type LmsAvisoEntrega } from './LmsEntregaExito';
import { encenderAvisoEntrega } from './lmsToast';
import {
  buildActividadFormData,
  errorActividadForm,
  etiquetasActividadForm,
  type LmsActividadFormInitial,
} from './lmsActividadForm';
import { partirPlazo } from './lmsPlazo';

type Props = Readonly<{
  saving: boolean;
  onSubmit: (body: FormData) => Promise<void>;
  initial?: LmsActividadFormInitial;
  onCancel?: () => void;
  soloLectura?: boolean;
}>;

/**
 * Formulario de alta o edición. `initial` activa el modo editar.
 */
export function LmsPublicarActividadForm({ saving, onSubmit, initial, onCancel, soloLectura = false }: Props) {
  const plazoIni = partirPlazo(initial?.plazo_entrega);
  const [titulo, setTitulo] = useState(initial?.titulo ?? '');
  const [cuerpo, setCuerpo] = useState(initial?.cuerpo ?? '');
  const [puntos, setPuntos] = useState(String(initial?.calificacion_max ?? 100));
  const [fecha, setFecha] = useState(plazoIni.fecha);
  const [hora, setHora] = useState(plazoIni.hora);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState<LmsAvisoEntrega | null>(null);
  const editar = initial != null;
  const textos = etiquetasActividadForm(editar, saving);

  async function handleSubmit() {
    setError('');
    const vals = { titulo, cuerpo, puntos, fecha, hora, files };
    const msg = errorActividadForm(vals);
    if (msg) {
      setError(msg);
      return;
    }
    try {
      await onSubmit(buildActividadFormData(vals));
      if (!editar) {
        setTitulo('');
        setCuerpo('');
        setPuntos('100');
        setFecha('');
        setHora('23:00');
        setFiles([]);
        encenderAvisoEntrega('publicada', setAviso);
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar');
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800"
    >
      <LmsEntregaExito visible={aviso === 'publicada'} variante="publicada" />
      <header className="flex items-start gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-5">
        <DocumentPlusIcon className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{textos.titulo}</h2>
          <p className="text-sm text-gray-500">
            {soloLectura ? 'Solo consulta: no puede publicar si no está asignado a esta ficha.' : textos.pista}
          </p>
        </div>
      </header>
      <fieldset disabled={soloLectura} className="space-y-4 px-4 py-5 sm:px-5">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <p>
          <label htmlFor="lms-titulo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Título
          </label>
          <input id="lms-titulo" className="input-field" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
        </p>
        <p>
          <label htmlFor="lms-cuerpo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Descripción
          </label>
          <textarea
            id="lms-cuerpo"
            className="input-field"
            rows={5}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            placeholder="Indique cómo desarrollar la guía o el trabajo."
          />
        </p>
        <LmsPublicarPuntos puntos={puntos} onPuntos={setPuntos} />
        {editar ? (
          <p className="text-xs text-gray-500">Los archivos actuales se conservan; aquí puede adjuntar más.</p>
        ) : null}
        <LmsPublicarArchivos files={files} onChange={setFiles} />
        <LmsPublicarVistaPrevia files={files} />
        <LmsPublicarPlazo fecha={fecha} hora={hora} onFecha={setFecha} onHora={setHora} />
        <p className="flex flex-col gap-2 sm:flex-row">
          {soloLectura ? null : (
            <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
              {textos.boton}
            </button>
          )}
          {onCancel ? (
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCancel}>
              Cancelar
            </button>
          ) : null}
        </p>
      </fieldset>
    </form>
  );
}
