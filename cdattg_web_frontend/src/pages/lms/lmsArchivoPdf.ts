/**
 * @module pages/lms/lmsArchivoPdf
 * @description La entrega del aprendiz solo admite PDF.
 * @author Cristian Deysdayr Jiménez
 */

/**
 * True si el nombre termina en .pdf.
 * @param {string} nombre Nombre del archivo.
 * @returns {boolean} True cuando es PDF.
 */
export function esPdfNombre(nombre: string): boolean {
  return nombre.toLowerCase().endsWith('.pdf');
}

/**
 * Mensaje si hay un archivo que no es PDF; null si cada uno es PDF.
 * @param files Adjuntos elegidos.
 * @returns {string | null} Error o null.
 */
export function mensajeArchivosNoPdf(files: ReadonlyArray<{ name: string }>): string | null {
  const malo = files.find((f) => !esPdfNombre(f.name));
  return malo ? `Solo se admite PDF: ${malo.name}` : null;
}
