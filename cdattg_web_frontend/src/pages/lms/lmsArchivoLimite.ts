/**
 * @module pages/lms/lmsArchivoLimite
 * @description Tope de tamaño de adjuntos LMS (alineado con el backend).
 * @author CRANDEYS
 * @created 2026-08-26
 */

/** 10 MB por archivo, igual que lmsMaxBytesArchivo en Go. */
export const LMS_MAX_BYTES_ARCHIVO = 10 * 1024 * 1024;

type ArchivoConTamano = Readonly<{ name: string; size: number }>;

/**
 * Mensaje si algún archivo supera 10 MB; null si todos caben.
 * @param files Adjuntos elegidos por el aprendiz.
 */
export function mensajeArchivosFueraDeLimite(files: ReadonlyArray<ArchivoConTamano>): string | null {
  const grande = files.find((f) => f.size > LMS_MAX_BYTES_ARCHIVO);
  return grande ? `El archivo ${grande.name} supera 10 MB` : null;
}
