/**
 * Pruebo el filtro de fichas de biblioteca.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { filtrarItemsBiblioteca, filtrarItemsListo } from '../carnetBiblioteca';
import { avanceListoDeFicha, etiquetaAvanceListo } from '../carnetBibliotecaAvance';
import type { CarnetBibliotecaItem } from '../../../types/carnet';

function item(id: number, fichaId: number): CarnetBibliotecaItem {
  return {
    id,
    primer_nombre: 'Ana',
    segundo_nombre: 'Maria',
    primer_apellido: 'Rojas',
    segundo_apellido: 'Perez',
    nombres: 'Ana Maria',
    apellidos: 'Rojas Perez',
    numero_documento: '1',
    rh: 'O+',
    ficha_id: fichaId,
    ficha_numero: String(fichaId),
    programa: 'ADSO',
    instructor_lider: 'Lider',
    tiene_foto: true,
    foto_url: '/api/impresora/carnets/foto?documento=1',
    listo: false,
  };
}

describe('filtrarItemsBiblioteca', () => {
  it('no muestra nadie si aún no eligió ficha', () => {
    const rows = [item(1, 8), item(2, 9)];
    expect(filtrarItemsBiblioteca(rows, 0)).toHaveLength(0);
  });

  it('deja solo la ficha elegida', () => {
    const rows = [item(1, 8), item(2, 9)];
    const got = filtrarItemsBiblioteca(rows, 8);
    expect(got).toHaveLength(1);
    expect(got[0].id).toBe(1);
  });
});

describe('filtrarItemsListo', () => {
  it('en todos salen todos y en listos solo los hechos', () => {
    const a = item(1, 8);
    const b = { ...item(2, 8), listo: true };
    expect(filtrarItemsListo([a, b], 'listos')).toEqual([b]);
    expect(filtrarItemsListo([a, b], 'todos')).toHaveLength(2);
  });
});

describe('avanceListoDeFicha', () => {
  it('cuenta 1/2 y el porcentaje', () => {
    const a = item(1, 8);
    const b = { ...item(2, 8), listo: true };
    const avance = avanceListoDeFicha([a, b], 8);
    expect(avance).toEqual({ listos: 1, total: 2 });
    expect(etiquetaAvanceListo(avance)).toBe('1/2 · 50%');
  });

  it('sin personas queda 0/0', () => {
    expect(etiquetaAvanceListo(avanceListoDeFicha([], 8))).toBe('0/0');
  });
});
