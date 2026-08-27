/**
 * @module pages/ficha-detalle/fichaDetalleNoop.test
 * @description Identidad estable de los no-op del overlay de ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { fichaDetalleNoop, fichaDetalleNoopAsync } from './fichaDetalleNoop';

describe('fichaDetalleNoop', () => {
  it('conserva la misma referencia entre usos', () => {
    expect(fichaDetalleNoop).toBe(fichaDetalleNoop);
    expect(fichaDetalleNoopAsync).toBe(fichaDetalleNoopAsync);
  });

  it('resuelve sin valor', async () => {
    expect(fichaDetalleNoop()).toBeUndefined();
    await expect(fichaDetalleNoopAsync()).resolves.toBeUndefined();
  });
});
