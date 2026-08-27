/**
 * @module pages/lms/lmsAulaToFicha.test
 * @description Mapeo de aula LMS a tarjeta de ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { aulaToFichaCard } from './lmsAulaToFicha';
import type { LmsAulaListItem } from '../../types/lms';

describe('aulaToFichaCard', () => {
  it('copia número, programa y sede', () => {
    const aula: LmsAulaListItem = {
      ficha_id: 9,
      numero_ficha: '2871234',
      nombre_programa: 'ADSO',
      tipo_formacion: 'FORMACION_REGULAR',
      puede_publicar: true,
      cantidad_aprendices: 20,
      instructor_nombre: 'Ana',
      sede_nombre: 'Centro',
      ambiente_nombre: 'B3',
      jornada_nombre: 'Diurna',
      modalidad_formacion_nombre: 'Presencial',
      status: true,
    };
    const ficha = aulaToFichaCard(aula);
    expect(ficha.id).toBe(9);
    expect(ficha.ficha).toBe('2871234');
    expect(ficha.sede_nombre).toBe('Centro');
    expect(ficha.cantidad_aprendices).toBe(20);
  });
});
