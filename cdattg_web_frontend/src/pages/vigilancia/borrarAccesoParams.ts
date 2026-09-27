/**
 * Armo el filtro de visitas para contar, ZIP y borrar.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoHistorialParams } from '../../types';

/**
 * Junto regional, sede y fechas para las llamadas de borrar acceso.
 */
export function paramsBorrar(regionalId: string, sedeId: string, desde: string, hasta: string): AccesoHistorialParams {
  const p: AccesoHistorialParams = { page: 1, page_size: 1 };
  if (regionalId) p.regional_id = Number(regionalId);
  if (sedeId) p.sede_id = Number(sedeId);
  if (desde) p.fecha_desde = desde;
  if (hasta) p.fecha_hasta = hasta;
  return p;
}
