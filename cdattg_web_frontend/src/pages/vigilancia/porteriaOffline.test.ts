/**
 * Compruebo tope de red, cola local y lookup sin servidor.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { aplicarColaAlDentro, aplicarColaAlLookup } from './porteriaCola';
import type { ColaAccesoItem } from './porteriaColaTipos';
import { lookupLocal, personaNuevaLocal, registroLocal } from './porteriaLookupLocal';
import { conTope } from './porteriaTiemposRed';
import type { AccesoLookupResponse } from '../../types';

function cola(parcial: Partial<ColaAccesoItem> & Pick<ColaAccesoItem, 'tipo'>): ColaAccesoItem {
  return {
    id: '1',
    numero_documento: '123',
    sede_id: 1,
    metodo_registro: 'LASER',
    creado_en: 1,
    ...parcial,
  };
}

function lookupBase(): AccesoLookupResponse {
  return lookupLocal('123', 1, 'ENTRADA');
}

describe('porteria offline', () => {
  it('si tarda de más, corto la espera', async () => {
    await expect(conTope(new Promise(() => undefined), 20)).rejects.toThrow(/tardó/);
  });

  it('deja pasar si llega a tiempo', async () => {
    await expect(conTope(Promise.resolve(7), 200)).resolves.toBe(7);
  });

  it('entrada pendiente marca adentro', () => {
    const l = aplicarColaAlLookup(lookupBase(), [cola({ tipo: 'INGRESO' })]);
    expect(l.dentro).toBe(true);
    expect(l.accion_sugerida).toBe('SALIDA');
  });

  it('salida pendiente saca de la lista', () => {
    const lista = aplicarColaAlDentro(
      [{
        visita_id: 9,
        persona: personaNuevaLocal('123'),
        tipo_persona: 'VISITANTE',
        timestamp_entrada: 't',
        metodo_registro: 'LASER',
      }],
      [cola({ tipo: 'SALIDA' })],
      1,
      personaNuevaLocal,
    );
    expect(lista).toHaveLength(0);
  });

  it('persona desconocida pide confirmación', () => {
    const l = lookupLocal('999', 2, 'ENTRADA');
    expect(l.persona.es_nueva).toBe(true);
    expect(l.puede_confirmar).toBe(true);
    expect(registroLocal(l, 'INGRESO').mensaje).toMatch(/red/);
  });
});

describe('esFalloDeRed', () => {
  it('el tope de tiempo es fallo de red', async () => {
    const { esFalloDeRed } = await import('./porteriaErrorRed');
    expect(esFalloDeRed(new Error('La red tardó demasiado.'))).toBe(true);
    expect(esFalloDeRed(new Error('ya tiene ingreso'))).toBe(false);
  });
});

describe('regla de portería', () => {
  it('ingreso abierto se trata como salida, no como error de cola', async () => {
    const { esIngresoAbierto, esSinIngresoAbierto } = await import('./porteriaReglaAcceso');
    expect(esIngresoAbierto(new Error('la persona ya tiene un ingreso abierto; registre la salida primero'))).toBe(true);
    expect(esSinIngresoAbierto(new Error('no hay un ingreso abierto para esta persona'))).toBe(true);
    expect(esIngresoAbierto(new Error('faltan 10 segundos'))).toBe(false);
  });
});
