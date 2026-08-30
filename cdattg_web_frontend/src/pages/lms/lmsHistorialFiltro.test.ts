/**
 * @module pages/lms/lmsHistorialFiltro.test
 * @description Recorte por aprendiz y actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { filtrarFilasHistorial, leerActividadId } from './lmsHistorialFiltro';
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
    const list = filtrarFilasHistorial(base, { aprendiz: 'juan', actividadId: null });
    expect(list.map((f) => f.aprendiz_nombre)).toEqual(['JUAN PEREZ']);
  });

  it('filtra por la actividad elegida en la lista', () => {
    const list = filtrarFilasHistorial(base, { aprendiz: '', actividadId: 8 });
    expect(list.map((f) => f.titulo)).toEqual(['Tarea 2']);
  });

  it('sin texto ni lista deja todas', () => {
    expect(filtrarFilasHistorial(base, { aprendiz: '', actividadId: null })).toHaveLength(2);
  });

  it('lee el id de la lista o lo deja vacío', () => {
    expect(leerActividadId('8')).toBe(8);
    expect(leerActividadId('')).toBeNull();
    expect(leerActividadId('x')).toBeNull();
  });
});
