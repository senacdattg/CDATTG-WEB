/**
 * @module pages/portal/portalMediaUrl.test
 * @description Resolución de URL de imágenes del portal.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { portalMediaUrl } from '../../services/portalApi';

describe('portalMediaUrl', () => {
  it('deja absolutas', () => {
    expect(portalMediaUrl('https://cdn.example/a.png')).toBe('https://cdn.example/a.png');
  });

  it('vacío', () => {
    expect(portalMediaUrl('')).toBe('');
  });

  it('conserva rutas públicas del API', () => {
    const path = '/api/public/portal/archivos/abc.jpg';
    expect(portalMediaUrl(path).endsWith(path)).toBe(true);
  });
});
