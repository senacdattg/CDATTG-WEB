/**
 * Compruebo que la búsqueda automática no vuelva a esperar 3 segundos.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { AUTO_LOOKUP_MS, DEBOUNCE_MISMO_DOC_MS } from './porteriaLookupTiempos';

describe('porteriaLookupTiempos', () => {
  it('busca sola en menos de un segundo tras el último dígito', () => {
    expect(AUTO_LOOKUP_MS).toBeGreaterThan(0);
    expect(AUTO_LOOKUP_MS).toBeLessThan(1000);
  });

  it('no bloquea 3 segundos el mismo documento', () => {
    expect(DEBOUNCE_MISMO_DOC_MS).toBeGreaterThan(0);
    expect(DEBOUNCE_MISMO_DOC_MS).toBeLessThan(1500);
  });
});
