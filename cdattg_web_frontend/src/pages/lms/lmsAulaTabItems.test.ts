/**
 * @module pages/lms/lmsAulaTabItems.test
 * @description Orden de pestañas del aprendiz y el instructor.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsAulaTabItems } from './lmsAulaTabItems';

describe('lmsAulaTabItems', () => {
  it('el aprendiz ve pendientes, entregadas, vencidas y aprendices', () => {
    expect(lmsAulaTabItems(false, false).map((t) => t.label)).toEqual([
      'Actividades pendientes',
      'Actividades entregadas',
      'Actividades vencidas',
      'Aprendices',
    ]);
  });

  it('el instructor ve aprendices, mis, publicar e historial', () => {
    expect(lmsAulaTabItems(true, true).map((t) => t.label)).toEqual([
      'Aprendices',
      'Mis actividades',
      'Publicar actividad',
      'Historial de actividades',
    ]);
  });
});
