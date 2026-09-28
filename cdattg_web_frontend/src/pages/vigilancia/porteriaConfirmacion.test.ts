/**
 * Compruebo cuándo la salida pide confirmación.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import type { AccesoLookupResponse, AccesoPersonaFicha } from '../../types';
import { debeSalidaAutomatica, requiereConfirmacionSalida } from './porteriaConfirmacion';

function ficha(esNueva: boolean): AccesoPersonaFicha {
  return {
    persona_id: esNueva ? 0 : 1,
    numero_documento: '123',
    primer_nombre: 'Ana',
    segundo_nombre: '',
    primer_apellido: 'Pérez',
    segundo_apellido: '',
    nombre_completo: 'Ana Pérez',
    email: '',
    celular: '',
    telefono: '',
    es_nueva: esNueva,
    perfil_completo: false,
    tipo_sugerido: 'VISITANTE',
    tipos: ['VISITANTE'],
  };
}

function lookup(parcial: Partial<AccesoLookupResponse> & { persona: AccesoPersonaFicha }): AccesoLookupResponse {
  return {
    dentro: false,
    accion_sugerida: 'SALIDA',
    sede_id: 1,
    tipos_persona: [],
    motivos_salida: [],
    puede_confirmar: true,
    permite_salida_sin_ingreso: false,
    segundos_restantes_salida: 0,
    ...parcial,
  };
}

describe('porteriaConfirmacion', () => {
  it('pide confirmar si la persona es nueva', () => {
    const res = lookup({ persona: ficha(true), permite_salida_sin_ingreso: true });
    expect(requiereConfirmacionSalida(res)).toBe(true);
    expect(debeSalidaAutomatica(res)).toBe(false);
  });

  it('no pide confirmar si existe y no tiene ingreso abierto', () => {
    const res = lookup({ persona: ficha(false), permite_salida_sin_ingreso: true, dentro: false });
    expect(requiereConfirmacionSalida(res)).toBe(false);
    expect(debeSalidaAutomatica(res)).toBe(true);
  });

  it('sale sola si ya está adentro', () => {
    const res = lookup({
      persona: ficha(false),
      dentro: true,
      permite_salida_sin_ingreso: false,
    });
    expect(requiereConfirmacionSalida(res)).toBe(false);
    expect(debeSalidaAutomatica(res)).toBe(true);
  });
});
