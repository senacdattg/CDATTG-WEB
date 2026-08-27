/**
 * @module pages/lms/lmsAulasFiltro.test
 * @description Búsqueda de aulas por ficha, programa y tipo.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { aulaCoincideBusqueda, filtrarAulas } from './lmsAulasFiltro';
import type { LmsAulaListItem } from '../../types/lms';

function aula(parcial: Partial<LmsAulaListItem>): LmsAulaListItem {
  return {
    ficha_id: 1,
    numero_ficha: '3424052',
    nombre_programa: 'Gestion De La Seguridad Y Salud En El Trabajo',
    tipo_formacion: 'FORMACION_REGULAR',
    puede_publicar: true,
    cantidad_aprendices: 31,
    ...parcial,
  };
}

describe('aulaCoincideBusqueda', () => {
  it('acepta vacío', () => {
    expect(aulaCoincideBusqueda(aula({}), '  ')).toBe(true);
  });

  it('encuentra por número de ficha', () => {
    expect(aulaCoincideBusqueda(aula({}), '2405')).toBe(true);
    expect(aulaCoincideBusqueda(aula({}), '999')).toBe(false);
  });

  it('encuentra por programa sin importar mayúsculas', () => {
    expect(aulaCoincideBusqueda(aula({}), 'seguridad')).toBe(true);
    expect(aulaCoincideBusqueda(aula({}), 'ADSO')).toBe(false);
  });
});

describe('filtrarAulas', () => {
  const list = [
    aula({ ficha_id: 1, numero_ficha: '111', nombre_programa: 'ADSO', tipo_formacion: 'FORMACION_REGULAR' }),
    aula({ ficha_id: 2, numero_ficha: '222', nombre_programa: 'Cocina', tipo_formacion: 'COMPLEMENTARIA' }),
  ];

  it('combina tipo y texto', () => {
    expect(filtrarAulas(list, 'TODOS', 'adso')).toHaveLength(1);
    expect(filtrarAulas(list, 'COMPLEMENTARIA', 'adso')).toHaveLength(0);
    expect(filtrarAulas(list, 'COMPLEMENTARIA', '22')).toHaveLength(1);
  });
});
