/**
 * @module pages/lms/lmsAulaCuerpoVista.test
 * @description Avisos y paneles del aula según rol.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { LMS_TABS } from './lmsConstants';
import {
  lmsAvisoAprendizConsulta,
  lmsAvisoSuperConsulta,
  lmsMuestraPanel,
  lmsMuestraVencidas,
  lmsVerInicialTablon,
} from './lmsAulaCuerpoVista';

describe('lmsAvisoAprendizConsulta', () => {
  it('avisa solo si no ve notas y no puede entregar', () => {
    expect(lmsAvisoAprendizConsulta(false, false)).toBe(true);
    expect(lmsAvisoAprendizConsulta(false, true)).toBe(false);
    expect(lmsAvisoAprendizConsulta(true, false)).toBe(false);
  });
});

describe('lmsAvisoSuperConsulta', () => {
  it('avisa si es superadmin y no publica', () => {
    expect(lmsAvisoSuperConsulta(true, false)).toBe(true);
    expect(lmsAvisoSuperConsulta(true, true)).toBe(false);
    expect(lmsAvisoSuperConsulta(false, false)).toBe(false);
  });
});

describe('lmsVerInicialTablon', () => {
  it('el instructor no abre la vista en pendientes', () => {
    expect(lmsVerInicialTablon(true, 4)).toBeNull();
    expect(lmsVerInicialTablon(false, 4)).toBe(4);
    expect(lmsVerInicialTablon(false)).toBeNull();
  });
});

describe('lmsMuestraVencidas y lmsMuestraPanel', () => {
  it('vencidas solo para quien no publica', () => {
    expect(lmsMuestraVencidas(LMS_TABS.vencidas, false)).toBe(true);
    expect(lmsMuestraVencidas(LMS_TABS.vencidas, true)).toBe(false);
    expect(lmsMuestraVencidas(LMS_TABS.tablon, false)).toBe(false);
  });

  it('historial si la pestaña y el permiso coinciden', () => {
    expect(lmsMuestraPanel(LMS_TABS.historial, LMS_TABS.historial, true)).toBe(true);
    expect(lmsMuestraPanel(LMS_TABS.historial, LMS_TABS.historial, false)).toBe(false);
    expect(lmsMuestraPanel(LMS_TABS.mis, LMS_TABS.historial, true)).toBe(false);
  });
});
