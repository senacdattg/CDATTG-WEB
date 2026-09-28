/**
 * Compruebo la doble frase, el rango y el atajo de fechas.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import {
  FRASE_BORRAR_ACCESO,
  atajoFechaAcceso,
  haceDiasISO,
  hayRangoFechas,
  hoyISO,
  puedeConfirmarBorrar,
} from './borrarAccesoFrase';

describe('borrarAccesoFrase', () => {
  it('pide las dos frases iguales', () => {
    expect(puedeConfirmarBorrar(FRASE_BORRAR_ACCESO, FRASE_BORRAR_ACCESO)).toBe(true);
    expect(puedeConfirmarBorrar('ELIMINAR', 'eliminar')).toBe(false);
    expect(puedeConfirmarBorrar('ELIMINAR', '')).toBe(false);
  });

  it('exige al menos una fecha', () => {
    expect(hayRangoFechas('', '')).toBe(false);
    expect(hayRangoFechas('2026-01-01', '')).toBe(true);
    expect(hayRangoFechas('', '2026-01-02')).toBe(true);
  });

  it('marca el atajo según las fechas', () => {
    expect(atajoFechaAcceso(hoyISO(), hoyISO())).toBe('hoy');
    expect(atajoFechaAcceso(haceDiasISO(7), hoyISO())).toBe('7d');
    expect(atajoFechaAcceso('', hoyISO())).toBe('historico');
    expect(atajoFechaAcceso('2020-01-01', '2020-01-02')).toBe('');
  });
});
