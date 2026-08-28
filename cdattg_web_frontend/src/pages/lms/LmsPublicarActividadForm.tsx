/**
 * @module pages/lms/LmsPublicarActividadForm
 * @description Publicar o editar: título, descripción, puntos, archivos y plazo.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';
import { LmsPublicarArchivos, LmsPublicarPlazo, LmsPublicarPuntos } from './LmsPublicarCampos';
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
}>;

/**
 * Formulario de alta o edición. `initial` activa el modo editar.
 */
export function LmsPublicarActividadForm({ saving, onSubmit, initial }: Props) {
  const plazoIni = partirPlazo(initial?.plazo_entrega);
  const [titulo, setTitulo] = useState(initial?.titulo ?? '');
  const [cuerpo, setCuerpo] = useState(initial?.cuerpo ?? '');
  const [puntos, setPuntos] = useState(String(initial?.calificacion_max ?? 100));
  const [conPlazo, setConPlazo] = useState(plazoIni.conPlazo);
  const [fecha, setFecha] = useState(plazoIni.fecha);
  const [hora, setHora] = useState(plazoIni.hora);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const editar = initial != null;
  const textos = etiquetasActividadForm(editar, saving);

  /** Valida y envía el multipart; en alta limpia el formulario. */
  async function handleSubmit() {
    setError('');
    const vals = { titulo, cuerpo, puntos, conPlazo, fecha, hora, files };
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
        setConPlazo(false);
        setFecha('');
        setHora('23:00');
        setFiles([]);
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
      <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
        <DocumentPlusIcon className="mt-0.5 h-6 w-6 text-primary-600" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{textos.titulo}</h2>
          <p className="text-sm text-gray-500">{textos.pista}</p>
        </div>
      </header>
      <div className="space-y-4 px-5 py-5">
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
        <LmsPublicarPlazo
          conPlazo={conPlazo}
          fecha={fecha}
          hora={hora}
          onToggle={setConPlazo}
          onFecha={setFecha}
          onHora={setHora}
        />
        <button type="submit" disabled={saving} className="btn-primary">
          {textos.boton}
        </button>
      </div>
    </form>
  );
}
