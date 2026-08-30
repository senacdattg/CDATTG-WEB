/**
 * @module pages/lms/lmsMisPanel.test
 * @description El panel apunta a la actividad de la lista.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsActividadDePanel, lmsAulaStateEditar, lmsAulaStateVer, lmsMisPanelDesdeState, lmsPanelEditar, lmsPanelInicioAula, lmsPanelVer, lmsVerIdDesdeState } from './lmsMisPanel';
import type { LmsActividadItem } from '../../types/lms';

const item = (id: number): LmsActividadItem => ({
  id,
  tipo: 'TABLON',
  titulo: `A${id}`,
  cuerpo: '',
  habilita_carga: true,
  calificacion_max: 100,
  plazo_entrega: null,
  creado_en: '',
  archivos: [],
});

describe('lmsActividadDePanel', () => {
  it('devuelve la actividad del id', () => {
    expect(lmsActividadDePanel([item(1), item(4)], { modo: 'ver', id: 4 })?.titulo).toBe('A4');
  });

  it('no encuentra si el id no está o no hay panel', () => {
    expect(lmsActividadDePanel([item(1)], { modo: 'editar', id: 9 })).toBeUndefined();
    expect(lmsActividadDePanel([item(1)], null)).toBeUndefined();
  });
});

describe('lmsMisPanelDesdeState', () => {
  it('abre editar con un id válido', () => {
    expect(lmsMisPanelDesdeState(lmsAulaStateEditar(4))).toEqual(lmsPanelEditar(4));
    expect(lmsPanelVer(4)).toEqual({ modo: 'ver', id: 4 });
  });

  it('ignora estado vacío o inválido', () => {
    expect(lmsMisPanelDesdeState(null)).toBeNull();
    expect(lmsMisPanelDesdeState({ editarActividadId: '4' })).toBeNull();
    expect(lmsMisPanelDesdeState({ editarActividadId: 0 })).toBeNull();
  });
});

describe('lmsPanelInicioAula', () => {
  it('usa el panel mandado o abre lectura si hay id', () => {
    expect(lmsPanelInicioAula(lmsPanelEditar(4), 9)).toEqual(lmsPanelEditar(4));
    expect(lmsPanelInicioAula(null, 4)).toEqual(lmsPanelVer(4));
    expect(lmsPanelInicioAula(null, null)).toBeNull();
  });
});

describe('lmsVerIdDesdeState', () => {
  it('abre la vista con un id válido', () => {
    expect(lmsVerIdDesdeState(lmsAulaStateVer(4))).toBe(4);
  });

  it('ignora estado vacío o de editar', () => {
    expect(lmsVerIdDesdeState(null)).toBeNull();
    expect(lmsVerIdDesdeState(lmsAulaStateEditar(4))).toBeNull();
  });
});
