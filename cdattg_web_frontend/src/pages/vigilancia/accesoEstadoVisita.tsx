/**
 * Texto y color del estado de una visita en el reporte.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoHistorialItem } from '../../types';

export function claseEstadoVisita(estado: string): string {
  if (estado === 'abierto') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
  }
  if (estado === 'cancelado') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

export function textoEstadoVisita(estado: string): string {
  if (estado === 'abierto') return 'Dentro';
  if (estado === 'cancelado') return 'Cancelado';
  return 'Cerrado';
}

export function AccesoEstadoCelda({ item }: Readonly<{ item: AccesoHistorialItem }>) {
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${claseEstadoVisita(item.estado)}`}>
      {textoEstadoVisita(item.estado)}
    </span>
  );
}
