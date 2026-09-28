/**
 * Pruebo que el mínimo de fecha no corte a 30 días.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { ayerISO, fechaLocalISO, minFechaRetroISO } from './cargaRetroactivaFechas';

describe('cargaRetroactivaFechas', () => {
  it('formatea local', () => {
    expect(fechaLocalISO(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('ayer es anterior a hoy', () => {
    const hoy = fechaLocalISO(new Date());
    expect(ayerISO() < hoy).toBe(true);
  });

  it('el mínimo queda años atrás', () => {
    const min = minFechaRetroISO();
    const hace90 = new Date();
    hace90.setDate(hace90.getDate() - 90);
    expect(min < fechaLocalISO(hace90)).toBe(true);
  });
});
