/**
 * @module pages/lms/lmsArchivoLimite.test
 * @description Validación del tope de 10 MB en entregas LMS.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { LMS_MAX_BYTES_ARCHIVO, mensajeArchivosFueraDeLimite } from './lmsArchivoLimite';

describe('mensajeArchivosFueraDeLimite', () => {
  it('acepta archivos dentro del tope', () => {
    expect(mensajeArchivosFueraDeLimite([{ name: 'guia.pdf', size: LMS_MAX_BYTES_ARCHIVO }])).toBeNull();
  });

  it('rechaza el primero que supera 10 MB', () => {
    const files = [
      { name: 'ok.pdf', size: 1024 },
      { name: 'grande.pdf', size: LMS_MAX_BYTES_ARCHIVO + 1 },
    ];
    expect(mensajeArchivosFueraDeLimite(files)).toBe('El archivo grande.pdf supera 10 MB');
  });

  it('devuelve null si no hay archivos', () => {
    expect(mensajeArchivosFueraDeLimite([])).toBeNull();
  });
});
