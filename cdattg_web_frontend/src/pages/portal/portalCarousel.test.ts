/**
 * @module pages/portal/portalCarousel.test
 * @description Avance del carrusel (feliz, borde, vacío).
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { claseCapaCarrusel, hrefCarruselSeguro, siguienteIndiceCarrusel } from './portalCarouselLogic';

describe('siguienteIndiceCarrusel', () => {
  it('avanza al siguiente', () => {
    expect(siguienteIndiceCarrusel(0, 3)).toBe(1);
  });

  it('vuelve al inicio al terminar', () => {
    expect(siguienteIndiceCarrusel(2, 3)).toBe(0);
  });

  it('sin diapositivas queda en 0', () => {
    expect(siguienteIndiceCarrusel(4, 0)).toBe(0);
  });
});

describe('claseCapaCarrusel', () => {
  it('la activa es opaca y la inactiva transparente', () => {
    expect(claseCapaCarrusel(true)).toContain('opacity-100');
    expect(claseCapaCarrusel(false)).toContain('opacity-0');
    expect(claseCapaCarrusel(true)).toContain('duration-700');
  });
});

describe('hrefCarruselSeguro', () => {
  it('acepta https y rutas internas', () => {
    expect(hrefCarruselSeguro('https://sena.edu.co')).toContain('https://');
    expect(hrefCarruselSeguro('/registro')).toBe('/registro');
  });

  it('rechaza javascript', () => {
    expect(hrefCarruselSeguro('javascript:alert(1)')).toBe('');
  });
});
