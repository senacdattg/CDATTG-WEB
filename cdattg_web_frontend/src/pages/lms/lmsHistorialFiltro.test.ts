/**
 * @module pages/lms/lmsHistorialFiltro.test
 * @description Recorte por nombre de aprendiz.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { filtrarFilasHistorial } from './lmsHistorialFiltro';
import type { LmsHistorialFila } from '../../types/lms';

function fila(parcial: Partial<LmsHistorialFila>): LmsHistorialFila {
  return {
    aprendiz_id: 1,
    aprendiz_nombre: 'ANA LOPEZ',
    actividad_id: 4,
    titulo: 'Guía 1',
    calificacion: 85,
    calificacion_max: 100,
    ...parcial,
  };
}

const base = [
  fila({}),
  fila({ aprendiz_id: 2, aprendiz_nombre: 'JUAN PEREZ', actividad_id: 8, titulo: 'Tarea 2' }),
];

describe('filtrarFilasHistorial', () => {
  it('filtra por nombre de aprendiz', () => {
    const list = filtrarFilasHistorial(base, 'juan');
    expect(list.map((f) => f.aprendiz_nombre)).toEqual(['JUAN PEREZ']);
  });

  it('sin texto deja todas', () => {
    expect(filtrarFilasHistorial(base, '')).toHaveLength(2);
  });
});
