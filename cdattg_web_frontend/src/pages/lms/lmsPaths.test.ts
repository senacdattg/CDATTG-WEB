/**
 * @module pages/lms/lmsPaths.test
 * @description Rutas del módulo LMS.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsPaths } from '../../routes/paths';

describe('lmsPaths', () => {
  it('expone índice, aulas, aula y actividad', () => {
    expect(lmsPaths.index).toBe('/lms');
    expect(lmsPaths.aulas).toBe('/lms/aulas');
    expect(lmsPaths.aula(12)).toBe('/lms/aulas/12');
    expect(lmsPaths.actividad(12, 4)).toBe('/lms/aulas/12/actividades/4');
  });
});
