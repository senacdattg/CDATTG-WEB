import { describe, expect, it } from 'vitest';
import { segundosParaSalida } from './esperaSalida';
import type { AccesoLookupResponse } from '../../types';

function visita(entradaISO: string, backend = 0): AccesoLookupResponse {
  return {
    segundos_restantes_salida: backend,
    visita_abierta: {
      id: 1,
      tipo_persona: 'APRENDIZ',
      timestamp_entrada: entradaISO,
      metodo_registro: 'LASER',
    },
  } as AccesoLookupResponse;
}

function hace(segundos: number): string {
  return new Date(Date.now() - segundos * 1000).toISOString();
}

describe('segundosParaSalida', () => {
  it('exige esperar cuando la entrada es muy reciente', () => {
    const restante = segundosParaSalida(visita(hace(2)));
    expect(restante).toBeGreaterThan(0);
    expect(restante).toBeLessThanOrEqual(8);
  });

  it('no espera cuando ya pasaron los 10 segundos', () => {
    expect(segundosParaSalida(visita(hace(10)))).toBe(0);
    expect(segundosParaSalida(visita(hace(60)))).toBe(0);
  });

  it('usa el valor del backend cuando es mayor', () => {
    // El backend es la fuente de la regla: si dice 6, se respetan 6 aunque el reloj local diga menos.
    expect(segundosParaSalida(visita(hace(30), 6))).toBe(6);
  });

  it('no se salta la espera por un backend que devuelve 0', () => {
    expect(segundosParaSalida(visita(hace(3), 0))).toBeGreaterThan(0);
  });

  it('no espera en salida irregular (sin visita abierta)', () => {
    expect(segundosParaSalida({ segundos_restantes_salida: 0 } as AccesoLookupResponse)).toBe(0);
  });

  it('tolera una fecha de entrada inválida', () => {
    expect(segundosParaSalida(visita('no-es-fecha', 3))).toBe(3);
  });
});
