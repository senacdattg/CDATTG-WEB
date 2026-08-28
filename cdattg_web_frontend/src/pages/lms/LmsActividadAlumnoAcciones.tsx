/**
 * @module pages/lms/LmsActividadAlumnoAcciones
 * @description Entregar, deshacer o aviso si solo puede consultar.
 * @author Cristian Deysdayr Jiménez
 */
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { LmsSoloConsultaAviso } from './LmsSoloConsultaAviso';

type Props = Readonly<{
  puedeEntregar: boolean;
  entregada: boolean;
  saving: boolean;
  etiqueta: string;
  tieneArchivos: boolean;
  onElegir: (files: File[]) => void;
  onEnviar: () => void;
  onDeshacer: () => void;
}>;

/**
 * Un solo bloque de acciones, sin anidar condiciones.
 */
export function LmsActividadAlumnoAcciones({
  puedeEntregar,
  entregada,
  saving,
  etiqueta,
  tieneArchivos,
  onElegir,
  onEnviar,
  onDeshacer,
}: Props) {
  if (puedeEntregar && entregada) {
    return (
      <footer>
        <button type="button" className="btn-secondary w-full sm:w-auto" disabled={saving} onClick={onDeshacer}>
          Deshacer entrega
        </button>
      </footer>
    );
  }
  if (puedeEntregar) {
    return (
      <>
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="btn-secondary inline-flex w-full cursor-pointer items-center justify-center gap-2 sm:w-auto">
            <PaperClipIcon className="h-4 w-4" aria-hidden />
            {tieneArchivos ? 'Reemplazar o agregar PDF' : 'Adjuntar PDF'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="sr-only"
              onChange={(e) => onElegir(Array.from(e.target.files ?? []))}
            />
          </label>
          <button type="button" className="btn-primary w-full sm:w-auto" disabled={saving} onClick={onEnviar}>
            {etiqueta}
          </button>
        </footer>
        <p className="text-xs text-gray-500">Solo PDF, máximo 10 MB.</p>
      </>
    );
  }
  return (
    <LmsSoloConsultaAviso>
      Solo consulta: puede ver lo que ya entregó. No puede subir ni deshacer archivos.
    </LmsSoloConsultaAviso>
  );
}
