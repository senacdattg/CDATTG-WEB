/**
 * Compruebo que cancelar el guardado no cuenta como descargado.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { guardarZipRespaldo } from './guardarZipRespaldo';

describe('guardarZipRespaldo', () => {
  it('sin ventana de guardar pide confirmar a mano', async () => {
    const got = await guardarZipRespaldo(new Blob(['x']), 'a.zip');
    expect(got).toBe('pendiente_confirmar');
  });
});
