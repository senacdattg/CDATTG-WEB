/**
 * @module pages/lms/lmsHistorialMatriz.test
 * @description Un nombre y varias actividades en horizontal.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { armarMatrizHistorial } from './lmsHistorialMatriz';
import type { LmsHistorialFila } from '../../types/lms';

const fila = (parcial: Partial<LmsHistorialFila>): LmsHistorialFila => ({
  aprendiz_id: 2,
  aprendiz_nombre: 'ANA LOPEZ',
  actividad_id: 4,
  titulo: 'Guía 1',
  calificacion: 85,
  calificacion_max: 100,
  ...parcial,
});

describe('armarMatrizHistorial', () => {
  it('deja el nombre una vez y dos columnas de actividad', () => {
    const { columnas, personas } = armarMatrizHistorial([
      fila({}),
      fila({ actividad_id: 8, titulo: 'Tarea 2', calificacion: null, calificacion_max: 50 }),
    ]);
    expect(columnas.map((c) => c.titulo)).toEqual(['Guía 1', 'Tarea 2']);
    expect(personas).toHaveLength(1);
    expect(personas[0].nombre).toBe('ANA LOPEZ');
    expect(personas[0].notas[0]?.calificacion).toBe(85);
    expect(personas[0].notas[1]?.calificacion).toBeNull();
  });

  it('sin filas no arma columnas', () => {
    expect(armarMatrizHistorial([])).toEqual({ columnas: [], personas: [] });
  });
});
