/**
 * @module pages/lms/lmsHistorialFiltro.test
 * @description Recorte por aprendiz, actividad y estado.
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
    estado: true,
    oculto_en_asistencia: false,
    ...parcial,
  };
}

const base = [
  fila({}),
  fila({ aprendiz_id: 2, aprendiz_nombre: 'JUAN PEREZ', actividad_id: 8, titulo: 'Tarea 2' }),
  fila({
    aprendiz_id: 3,
    aprendiz_nombre: 'LUIS OCULTO',
    oculto_en_asistencia: true,
    titulo: 'Guía 1',
  }),
];

describe('filtrarFilasHistorial', () => {
  it('filtra por nombre de aprendiz', () => {
    const list = filtrarFilasHistorial(base, { aprendiz: 'juan', actividadId: null, estado: 'todos' });
    expect(list.map((f) => f.aprendiz_nombre)).toEqual(['JUAN PEREZ']);
  });

  it('filtra por la actividad elegida en la lista', () => {
    const list = filtrarFilasHistorial(base, { aprendiz: '', actividadId: 8, estado: 'todos' });
    expect(list.map((f) => f.titulo)).toEqual(['Tarea 2']);
  });

  it('el chip activos oculta a los ocultos en asistencia', () => {
    const list = filtrarFilasHistorial(base, { aprendiz: '', actividadId: null, estado: 'activos' });
    expect(list.map((f) => f.aprendiz_nombre)).toEqual(['ANA LOPEZ', 'JUAN PEREZ']);
  });

  it('el chip ocultos deja solo los ocultos en asistencia', () => {
    const list = filtrarFilasHistorial(base, { aprendiz: '', actividadId: null, estado: 'ocultos' });
    expect(list.map((f) => f.aprendiz_nombre)).toEqual(['LUIS OCULTO']);
  });

  it('sin texto ni chip deja todas', () => {
    expect(filtrarFilasHistorial(base, { aprendiz: '', actividadId: null, estado: 'todos' })).toHaveLength(3);
  });

  it('lee el id de la lista o lo deja vacío', () => {
    expect(leerActividadId('8')).toBe(8);
    expect(leerActividadId('')).toBeNull();
    expect(leerActividadId('x')).toBeNull();
  });

  it('el inactivo no entra en activos', () => {
    const list = filtrarFilasHistorial(
      [...base, fila({ aprendiz_id: 9, aprendiz_nombre: 'INA', estado: false })],
      { aprendiz: '', actividadId: null, estado: 'activos' },
    );
    expect(list.map((f) => f.aprendiz_nombre)).toEqual(['ANA LOPEZ', 'JUAN PEREZ']);
  });
});
