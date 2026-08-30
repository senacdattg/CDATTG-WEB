/**
 * @module pages/lms/lmsHistorialTab.test
 * @description Ida y vuelta entre el historial y la actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { LMS_TABS } from './lmsConstants';
import {
  lmsAulaStateHistorial,
  lmsEsTabHistorial,
  lmsStateDesdeHistorial,
  lmsTabInicialAula,
  lmsVieneDelHistorial,
  lmsVolverDesdeEntrega,
} from './lmsHistorialTab';

describe('lmsHistorialTab', () => {
  it('abre el historial al volver al aula', () => {
    expect(lmsEsTabHistorial(lmsAulaStateHistorial())).toBe(true);
    expect(lmsEsTabHistorial({})).toBe(false);
  });

  it('marca que se salió del historial', () => {
    expect(lmsVieneDelHistorial(lmsStateDesdeHistorial())).toBe(true);
    expect(lmsVieneDelHistorial(null)).toBe(false);
  });

  it('prioriza editar y abre historial si lo piden', () => {
    expect(lmsTabInicialAula({ id: 1 }, true, true)).toBe(LMS_TABS.mis);
    expect(lmsTabInicialAula(null, true, true)).toBe(LMS_TABS.historial);
    expect(lmsTabInicialAula(null, false, true)).toBe(LMS_TABS.tablon);
    expect(lmsTabInicialAula(null, true, false)).toBe(LMS_TABS.tablon);
  });

  it('vuelve al historial si salió de ahí', () => {
    const fromHist = lmsVolverDesdeEntrega(1, 4, lmsStateDesdeHistorial());
    expect(fromHist.to).toBe('/lms/aulas/1');
    expect(fromHist.state).toEqual(lmsAulaStateHistorial());
    expect(lmsVolverDesdeEntrega(1, 4, null).to).toBe('/lms/aulas/1/actividades/4/aprendices');
  });
});
