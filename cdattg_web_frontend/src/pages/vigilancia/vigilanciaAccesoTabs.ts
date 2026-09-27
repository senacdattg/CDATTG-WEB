/**
 * Digo quién ve la pestaña de borrar visitas y el ZIP.
 *
 * @author Cristian Deysdayr Jiménez
 */

export const PERM_BORRAR_ACCESO_SEDE = 'BORRAR ACCESO SEDE';

export type TabAccesoId = 'reporte' | 'salida' | 'borrar' | 'stubs';

const TABS_ACCESO: { id: TabAccesoId; texto: string }[] = [
  { id: 'reporte', texto: 'Reporte' },
  { id: 'salida', texto: 'Salida masiva' },
  { id: 'borrar', texto: 'Borrar registros' },
  { id: 'stubs', texto: 'Personas sin nombre' },
];

/**
 * Superadmin entra con *. El vigilante de portería no ve borrar ni ZIP.
 */
export function puedeBorrarRegistrosAcceso(hasPermission: (p: string) => boolean): boolean {
  return hasPermission(PERM_BORRAR_ACCESO_SEDE);
}

/**
 * Quito la pestaña de borrar si no hay permiso.
 */
export function tabsAccesoVisibles(puedeBorrar: boolean): { id: TabAccesoId; texto: string }[] {
  if (puedeBorrar) return TABS_ACCESO;
  return TABS_ACCESO.filter((t) => t.id !== 'borrar');
}
