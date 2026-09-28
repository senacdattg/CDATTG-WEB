/**
 * Compruebo que un permiso abre el menú de vigilancia sin el rol escrito.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { isSidebarItemVisible } from '../../components/layout/sidebarVisibility';
import type { SidebarManifestItem } from '../../navigation/sidebar';

const reporte: SidebarManifestItem = {
  section: 'Vigilancia',
  path: '/vigilancia/accesos',
  label: 'Reporte de accesos',
  permission: 'VER ACCESO SEDE',
  rolesRequired: ['VIGILANTE'],
  alsoVisibleForPermissions: ['VER ACCESO SEDE'],
  iconKey: 'vigilancia/reporte',
};

describe('sidebar vigilancia', () => {
  it('muestra reporte si tiene VER ACCESO aunque el rol no venga', () => {
    const ok = isSidebarItemVisible(reporte, [], (p) => p === 'VER ACCESO SEDE');
    expect(ok).toBe(true);
  });

  it('oculta reporte si no hay permiso ni rol', () => {
    expect(isSidebarItemVisible(reporte, [], () => false)).toBe(false);
  });
});
