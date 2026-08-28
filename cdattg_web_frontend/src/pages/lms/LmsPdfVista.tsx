/**
 * @module pages/lms/LmsPdfVista
 * @description Vista previa del PDF; se puede ocultar si no se quiere ver.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';

type Props = Readonly<{ titulo: string; blobUrl: string; inicialAbierta?: boolean }>;

/**
 * Texto del botón según si el marco está abierto.
 * @param {boolean} abierta True si se ve el PDF.
 * @returns {string} Ocultar o mostrar.
 */
export function etiquetaVistaPdf(abierta: boolean): string {
  return abierta ? 'Ocultar vista previa' : 'Mostrar vista previa';
}

/**
 * Marco del PDF. Abrir en pestaña no descarga; el botón pliega el iframe.
 */
export function LmsPdfVista({ titulo, blobUrl, inicialAbierta = true }: Props) {
  const [abierta, setAbierta] = useState(inicialAbierta);
  return (
    <figure className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/40">
      <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200">
        <span className="truncate">{titulo}</span>
        <span className="flex shrink-0 items-center gap-3">
          <a href={blobUrl} target="_blank" rel="noreferrer" className="text-primary-700 hover:underline dark:text-primary-300">
            Abrir PDF
          </a>
          <button
            type="button"
            className="text-gray-600 hover:underline dark:text-gray-300"
            onClick={() => setAbierta((v) => !v)}
          >
            {etiquetaVistaPdf(abierta)}
          </button>
        </span>
      </figcaption>
      {abierta ? <iframe title={titulo} src={blobUrl} className="h-96 w-full border-0 bg-white" /> : null}
    </figure>
  );
}
