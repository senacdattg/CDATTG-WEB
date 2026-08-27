/**
 * @module pages/lms/lmsPlazo.test
 * @description Combinación de fecha y hora de entrega.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { combinarPlazo, partirPlazo } from './lmsPlazo';

describe('combinarPlazo', () => {
  it('une fecha y hora', () => {
    expect(combinarPlazo('2026-08-30', '18:00')).toBe('2026-08-30T18:00');
  });

  it('usa 23:00 si no hay hora', () => {
    expect(combinarPlazo('2026-08-30', '')).toBe('2026-08-30T23:00');
  });

  it('vacío sin fecha', () => {
    expect(combinarPlazo('', '18:00')).toBe('');
  });
});

describe('partirPlazo', () => {
  it('marca sin plazo si no hay ISO', () => {
    expect(partirPlazo(null)).toEqual({ conPlazo: false, fecha: '', hora: '23:00' });
  });

  it('separa fecha y hora en zona Colombia', () => {
    const got = partirPlazo('2026-08-30T23:00:00-05:00');
    expect(got.conPlazo).toBe(true);
    expect(got.fecha).toBe('2026-08-30');
    expect(got.hora).toBe('23:00');
  });
});
