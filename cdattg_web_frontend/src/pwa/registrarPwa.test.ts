/**
 * Pruebo que en desarrollo no registro el service worker.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it, vi } from 'vitest';
import { registrarPwa } from './registrarPwa';

describe('registrarPwa', () => {
  it('no registra fuera de producción', () => {
    const register = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    registrarPwa();
    expect(register).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
