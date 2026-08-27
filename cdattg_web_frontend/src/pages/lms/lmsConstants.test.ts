/**
 * @module pages/lms/lmsConstants.test
 * @description Etiquetas de tipo de actividad LMS.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { labelTipoActividad } from './lmsConstants';

describe('labelTipoActividad', () => {
  it('traduce TRABAJO a Trabajo de clase', () => {
    expect(labelTipoActividad('TRABAJO')).toBe('Trabajo de clase');
  });

  it('devuelve el código si no hay etiqueta', () => {
    expect(labelTipoActividad('OTRO')).toBe('OTRO');
  });
});
