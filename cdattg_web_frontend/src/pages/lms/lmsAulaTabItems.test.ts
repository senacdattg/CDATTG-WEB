/**
 * @module pages/lms/lmsAulaTabItems.test
 * @description Orden de pestañas del instructor y del aprendiz.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsAulaTabItems } from './lmsAulaTabItems';

describe('lmsAulaTabItems', () => {
  it('el instructor ve aprendices, mis, publicar e historial', () => {
    expect(lmsAulaTabItems(true, true).map((t) => t.label)).toEqual([
      'Aprendices',
      'Mis actividades',
      'Publicar actividad',
      'Historial de actividades',
    ]);
  });

  it('el aprendiz no ve historial ni publicar', () => {
    const labels = lmsAulaTabItems(false, false).map((t) => t.label);
    expect(labels).toEqual([
      'Actividades pendientes',
      'Actividades entregadas',
      'Actividades vencidas',
      'Aprendices',
    ]);
  });

  it('el superadmin ve todos los módulos', () => {
    expect(lmsAulaTabItems(false, true, true).map((t) => t.label)).toEqual([
      'Actividades pendientes',
      'Actividades entregadas',
      'Actividades vencidas',
      'Aprendices',
      'Mis actividades',
      'Publicar actividad',
      'Historial de actividades',
    ]);
  });
});
