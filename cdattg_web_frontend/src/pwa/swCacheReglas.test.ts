/**
 * Pruebo que el worker no cachee API ni errores.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { debeGuardarEnCache, debeInterceptarFetch } from './swCacheReglas';

describe('swCacheReglas', () => {
  const origen = 'https://cdattg.example';

  it('deja pasar POST', () => {
    expect(debeInterceptarFetch('POST', origen, origen, '/index.html')).toBe(false);
  });

  it('no intercepta /api', () => {
    expect(debeInterceptarFetch('GET', origen, origen, '/api/asistencias')).toBe(false);
  });

  it('no intercepta otro origen', () => {
    expect(debeInterceptarFetch('GET', 'https://otro.test', origen, '/logo.svg')).toBe(false);
  });

  it('intercepta GET de la app', () => {
    expect(debeInterceptarFetch('GET', origen, origen, '/index.html')).toBe(true);
  });

  it('guarda 200 y rechaza 502', () => {
    expect(debeGuardarEnCache(true)).toBe(true);
    expect(debeGuardarEnCache(false)).toBe(false);
  });
});
