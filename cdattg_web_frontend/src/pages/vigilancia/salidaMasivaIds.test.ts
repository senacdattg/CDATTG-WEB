/**
 * Compruebo el cálculo de quién sale y quién se queda.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import type { AccesoDentroItem } from '../../types';
import { filtrarDentro, toggleExcluir, visitasACerrar } from './salidaMasivaIds';

function item(id: number, nombre: string, doc: string): AccesoDentroItem {
  return {
    visita_id: id,
    tipo_persona: 'APRENDIZ',
    timestamp_entrada: '2026-01-01T08:00:00Z',
    metodo_registro: 'MANUAL',
    persona: {
      persona_id: id,
      numero_documento: doc,
      primer_nombre: nombre,
      segundo_nombre: '',
      primer_apellido: '',
      segundo_apellido: '',
      nombre_completo: nombre,
      email: '',
      celular: '',
      telefono: '',
      es_nueva: false,
      perfil_completo: true,
      tipo_sugerido: 'APRENDIZ',
      tipos: ['APRENDIZ'],
      tiene_foto: false,
      foto_desde_carnet: false,
    },
  };
}

describe('salidaMasivaIds', () => {
  it('cierra todas si nadie se excluye', () => {
    expect(visitasACerrar([1, 2], new Set())).toEqual([1, 2]);
  });

  it('omite las excluidas', () => {
    expect(visitasACerrar([1, 2, 3], new Set([2]))).toEqual([1, 3]);
  });

  it('marca y desmarca exclusión', () => {
    const a = toggleExcluir(new Set(), 9);
    expect(a.has(9)).toBe(true);
    expect(toggleExcluir(a, 9).has(9)).toBe(false);
  });

  it('filtra por nombre o documento', () => {
    const rows = [item(1, 'Ana Pérez', '100'), item(2, 'Luis Soto', '200')];
    expect(filtrarDentro(rows, 'ana')).toHaveLength(1);
    expect(filtrarDentro(rows, '200')).toHaveLength(1);
    expect(filtrarDentro(rows, '')).toHaveLength(2);
  });
});
