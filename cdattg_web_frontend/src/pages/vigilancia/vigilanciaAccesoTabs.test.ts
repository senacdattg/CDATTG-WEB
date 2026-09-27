/**
 * Compruebo que el vigilante no ve borrar registros.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { puedeBorrarRegistrosAcceso, tabsAccesoVisibles } from './vigilanciaAccesoTabs';

describe('vigilanciaAccesoTabs', () => {
  it('deja borrar si tiene el permiso', () => {
    expect(puedeBorrarRegistrosAcceso((p) => p === 'BORRAR ACCESO SEDE')).toBe(true);
  });

  it('bloquea borrar si no tiene el permiso', () => {
    expect(puedeBorrarRegistrosAcceso(() => false)).toBe(false);
  });

  it('oculta la pestaña de borrar al vigilante', () => {
    const tabs = tabsAccesoVisibles(false);
    expect(tabs.some((t) => t.id === 'borrar')).toBe(false);
    expect(tabs.some((t) => t.id === 'reporte')).toBe(true);
  });

  it('muestra borrar al super vigilante', () => {
    expect(tabsAccesoVisibles(true).some((t) => t.id === 'borrar')).toBe(true);
  });
});
