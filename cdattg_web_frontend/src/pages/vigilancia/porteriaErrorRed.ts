/**
 * Distingo si falló la red o si el servidor sí respondió (no encolo un 400).
 *
 * @author Cristian Deysdayr Jiménez
 */
import axios from 'axios';

/**
 * True si no hubo respuesta del servidor (corte, tope de tiempo).
 */
export function esFalloDeRed(e: unknown): boolean {
  if (e instanceof Error && e.message.includes('tardó')) return true;
  return axios.isAxiosError(e) && !e.response;
}
