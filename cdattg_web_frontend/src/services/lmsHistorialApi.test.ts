/**
 * @module services/lmsHistorialApi.test
 * @description Cliente del historial: lista o vacío.
 * @author Cristian Deysdayr Jiménez
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('axios', () => ({
  default: {
    create: () => ({
      get,
      interceptors: { request: { use: vi.fn() } },
    }),
  },
}));

import { fetchLmsHistorial } from './lmsHistorialApi';

describe('fetchLmsHistorial', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('pide las notas del aula', async () => {
    get.mockResolvedValue({ data: { data: [{ aprendiz_nombre: 'ANA' }] } });
    const list = await fetchLmsHistorial(12);
    expect(get).toHaveBeenCalledWith('/lms/aulas/12/calificaciones');
    expect(list[0].aprendiz_nombre).toBe('ANA');
  });

  it('devuelve vacío si no hay data', async () => {
    get.mockResolvedValue({ data: {} });
    expect(await fetchLmsHistorial(12)).toEqual([]);
  });
});
