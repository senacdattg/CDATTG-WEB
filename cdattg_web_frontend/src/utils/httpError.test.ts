/**
 * @module utils/httpError.test
 * @description Mensajes Axios, incluido 413 de Nginx.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { axiosErrorMessage } from './httpError';

function errorAxios(status: number, data: unknown): unknown {
  return { isAxiosError: true, response: { status, data } };
}

describe('axiosErrorMessage', () => {
  it('explica 413 aunque Nginx devuelva HTML', () => {
    const html = '<html><head><title>413 Request Entity Too Large</title></head></html>';
    expect(axiosErrorMessage(errorAxios(413, html), 'No se pudo entregar')).toBe(
      'El archivo supera el tamaño máximo (10 MB).',
    );
  });

  it('mantiene el aviso 405 en HTML', () => {
    const html = '<html><body>Method Not Allowed</body></html>';
    expect(axiosErrorMessage(errorAxios(405, html), 'Error')).toContain('405');
  });

  it('usa el fallback si no hay detalle', () => {
    expect(axiosErrorMessage(new Error('network error'), 'Fallo de red')).toBe('Fallo de red');
  });
});
