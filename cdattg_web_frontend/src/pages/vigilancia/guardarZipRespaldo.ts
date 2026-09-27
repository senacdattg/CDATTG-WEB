/**
 * Guardo el ZIP en el disco. Si cancelan la ventana, no cuento la descarga.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { descargarBlob } from './descargarBlob';

export type ResultadoGuardarZip = 'guardado' | 'cancelado' | 'pendiente_confirmar';

type FilePickerWindow = Window & {
  showSaveFilePicker?: (opts: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
  }>;
};

function esAborto(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'name' in err && (err as { name: string }).name === 'AbortError';
}

/**
 * Pido dónde guardar. Si cancela, no queda descargado.
 */
export async function guardarZipRespaldo(blob: Blob, nombre: string): Promise<ResultadoGuardarZip> {
  const win = globalThis as unknown as FilePickerWindow;
  if (typeof win.showSaveFilePicker !== 'function') {
    descargarBlob(blob, nombre);
    return 'pendiente_confirmar';
  }
  try {
    const handle = await win.showSaveFilePicker({
      suggestedName: nombre,
      types: [{ description: 'ZIP', accept: { 'application/zip': ['.zip'] } }],
    });
    const w = await handle.createWritable();
    await w.write(blob);
    await w.close();
    return 'guardado';
  } catch (err: unknown) {
    if (esAborto(err)) return 'cancelado';
    throw err;
  }
}
