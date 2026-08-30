/**
 * @module pages/lms/lmsHistorialTexto.test
 * @description Nota con tope o sin calificar.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { textoNotaHistorial } from './lmsHistorialTexto';

describe('textoNotaHistorial', () => {
  it('junta lo que sacó y el tope', () => {
    expect(textoNotaHistorial(85, 100)).toBe('85 / 100');
  });

  it('dice Sin nota si aún no calificó', () => {
    expect(textoNotaHistorial(null, 50)).toBe('Sin nota / 50');
  });
});
