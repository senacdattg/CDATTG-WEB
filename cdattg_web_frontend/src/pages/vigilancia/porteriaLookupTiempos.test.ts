/**
 * Compruebo que al escribir se esperan 3 segundos antes de buscar sola.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { AUTO_LOOKUP_MS, DEBOUNCE_MISMO_DOC_MS } from './porteriaLookupTiempos';

describe('porteriaLookupTiempos', () => {
  it('espera tres segundos tras la última tecla', () => {
    expect(AUTO_LOOKUP_MS).toBe(3000);
  });

  it('no bloquea 3 segundos el mismo documento ya consultado', () => {
    expect(DEBOUNCE_MISMO_DOC_MS).toBeGreaterThan(0);
    expect(DEBOUNCE_MISMO_DOC_MS).toBeLessThan(1500);
  });
});
