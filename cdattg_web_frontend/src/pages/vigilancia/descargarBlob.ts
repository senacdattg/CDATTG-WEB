/**
 * Bajo el ZIP al disco del vigilante.
 *
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Disparo la descarga del archivo en el navegador.
 */
export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
