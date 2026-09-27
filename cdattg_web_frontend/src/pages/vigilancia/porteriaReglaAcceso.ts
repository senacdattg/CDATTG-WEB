/**
 * Distingo el “ya está adentro” y el “no hay ingreso”: el celador no se traba.
 *
 * Lo pongo aquí porque en portería, si hay visita abierta, aunque el modo sea
 * entrada, se registra salida. Si no hay visita, puede ser salida irregular.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { axiosErrorMessage } from '../../utils/httpError';

/**
 * El servidor dijo que ya hay un ingreso abierto.
 */
export function esIngresoAbierto(e: unknown): boolean {
  const t = axiosErrorMessage(e, '').toLowerCase();
  return t.includes('ingreso abierto') || t.includes('registre la salida');
}

/**
 * El servidor dijo que no hay visita abierta (sale irregular).
 */
export function esSinIngresoAbierto(e: unknown): boolean {
  const t = axiosErrorMessage(e, '').toLowerCase();
  return t.includes('no hay un ingreso abierto');
}
