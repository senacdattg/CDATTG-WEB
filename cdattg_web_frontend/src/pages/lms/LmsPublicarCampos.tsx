/**
 * @module pages/lms/LmsPublicarCampos
 * @description Campos de archivos, puntos y plazo al publicar.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { PaperClipIcon } from '@heroicons/react/24/outline';

type ArchivosProps = Readonly<{
  files: File[];
  onChange: (files: File[]) => void;
}>;

/**
 * Selector de documentos de la publicación.
 */
export function LmsPublicarArchivos({ files, onChange }: ArchivosProps) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-200">Archivos (opcional)</legend>
      <label
        htmlFor="lms-archivos"
        className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:border-primary-400 dark:border-gray-600 dark:bg-gray-900/40"
      >
        <PaperClipIcon className="h-8 w-8 text-primary-600" aria-hidden />
        <span className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Clic para adjuntar PDF, Office o imágenes
        </span>
      </label>
      <input
        id="lms-archivos"
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
      {files.length > 0 ? (
        <ul className="mt-2 list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
          {files.map((f) => (
            <li key={`${f.name}-${f.size}`}>{f.name}</li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}

type PuntosProps = Readonly<{ puntos: string; onPuntos: (v: string) => void }>;

/**
 * Valor de la actividad en la escala 0-100.
 */
export function LmsPublicarPuntos({ puntos, onPuntos }: PuntosProps) {
  return (
    <p>
      <label htmlFor="lms-puntos" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
        Puntos (0-100)
      </label>
      <input
        id="lms-puntos"
        className="input-field"
        type="number"
        min={0}
        max={100}
        step={1}
        value={puntos}
        onChange={(e) => onPuntos(e.target.value)}
        required
      />
    </p>
  );
}

type PlazoProps = Readonly<{
  conPlazo: boolean;
  fecha: string;
  hora: string;
  onToggle: (v: boolean) => void;
  onFecha: (v: string) => void;
  onHora: (v: string) => void;
}>;

/**
 * Plazo de entrega: calendario y reloj, también se puede escribir.
 */
export function LmsPublicarPlazo({ conPlazo, fecha, hora, onToggle, onFecha, onHora }: PlazoProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Plazo de entrega</legend>
      <p className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        <input
          id="lms-con-plazo"
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-primary-600"
          checked={conPlazo}
          onChange={(e) => onToggle(e.target.checked)}
        />
        <label htmlFor="lms-con-plazo">Definir plazo de entrega</label>
      </p>
      {conPlazo ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <p>
            <label htmlFor="lms-fecha" className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Fecha
            </label>
            <input
              id="lms-fecha"
              type="date"
              className="input-field"
              value={fecha}
              onChange={(e) => onFecha(e.target.value)}
              required
            />
          </p>
          <p>
            <label htmlFor="lms-hora" className="mb-1 block text-sm text-gray-600 dark:text-gray-300">
              Hora
            </label>
            <input
              id="lms-hora"
              type="time"
              step={60}
              className="input-field"
              value={hora}
              onChange={(e) => onHora(e.target.value)}
            />
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Si no marca plazo, queda como publicación en el tablón sin vencimiento.</p>
      )}
    </fieldset>
  );
}
