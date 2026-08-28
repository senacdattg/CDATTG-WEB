/**
 * @module routes/lmsPaths.test
 * @description Rutas del módulo LMS.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsPaths } from './paths';

describe('lmsPaths', () => {
  it('expone índice, aulas, aula, actividad y auditoría', () => {
    expect(lmsPaths.index).toBe('/lms');
    expect(lmsPaths.aulas).toBe('/lms/aulas');
    expect(lmsPaths.aula(12)).toBe('/lms/aulas/12');
    expect(lmsPaths.actividad(12, 4)).toBe('/lms/aulas/12/actividades/4');
    expect(lmsPaths.auditoria).toBe('/lms/auditoria');
    expect(lmsPaths.auditoriaFicha(21)).toBe('/lms/auditoria/ficha/21');
    expect(lmsPaths.auditoriaPersona(8)).toBe('/lms/auditoria/8');
    expect(lmsPaths.auditoriaTipo(8, 'MEDIA_TECNICA')).toBe('/lms/auditoria/8/MEDIA_TECNICA');
  });
});
