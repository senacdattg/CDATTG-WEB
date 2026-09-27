/**
 * Compruebo el recorte de páginas de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { hojaDe, TAM_PAGINA_DENTRO, totalHojas } from './paginarLista';

describe('paginarLista', () => {
  it('la primera hoja trae 50', () => {
    const items = Array.from({ length: 120 }, (_, i) => i);
    expect(hojaDe(items, 1, TAM_PAGINA_DENTRO)).toHaveLength(50);
    expect(hojaDe(items, 1, TAM_PAGINA_DENTRO)[0]).toBe(0);
  });

  it('la tercera hoja trae el resto', () => {
    const items = Array.from({ length: 120 }, (_, i) => i);
    expect(hojaDe(items, 3, TAM_PAGINA_DENTRO)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 100),
    );
  });

  it('tam inválido no rompe', () => {
    expect(totalHojas(10, 0)).toBe(10);
    expect(hojaDe([1, 2, 3], 1, 0)).toEqual([1]);
  });

  it('cuenta hojas y corrige página de más', () => {
    expect(totalHojas(0, 50)).toBe(1);
    expect(totalHojas(50, 50)).toBe(1);
    expect(totalHojas(51, 50)).toBe(2);
    expect(hojaDe([1, 2], 9, 50)).toEqual([1, 2]);
  });
});
