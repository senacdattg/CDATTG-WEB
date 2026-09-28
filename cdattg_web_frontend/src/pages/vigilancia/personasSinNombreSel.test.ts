/**
 * Compruebo marcar y soltar todos los de la hoja.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { conTodosDeHoja, hojaTodaMarcada, textoMarcarHoja, toggleId } from './personasSinNombreSel';

describe('personasSinNombreSel', () => {
  it('pone y quita un id', () => {
    const a = toggleId(new Set(), 3);
    expect(a.has(3)).toBe(true);
    expect(toggleId(a, 3).has(3)).toBe(false);
  });

  it('marca todos si falta alguno', () => {
    const next = conTodosDeHoja(new Set([1]), [1, 2]);
    expect(next).toEqual(new Set([1, 2]));
  });

  it('suelta la hoja si ya estaban todos', () => {
    const next = conTodosDeHoja(new Set([1, 2, 9]), [1, 2]);
    expect(next).toEqual(new Set([9]));
  });

  it('dice si la hoja está toda marcada', () => {
    expect(hojaTodaMarcada(new Set([1, 2]), [1, 2])).toBe(true);
    expect(hojaTodaMarcada(new Set([1]), [1, 2])).toBe(false);
    expect(hojaTodaMarcada(new Set([1]), [])).toBe(false);
  });

  it('dice el texto del botón de la hoja', () => {
    expect(textoMarcarHoja(false)).toBe('Seleccionar a todos');
    expect(textoMarcarHoja(true)).toBe('Quitar selección');
  });
});
