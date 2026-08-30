/**
 * @module pages/lms/LmsAulaHistorialTabla.test
 * @description Un nombre, títulos en columnas y nota debajo.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaHistorialTabla } from './LmsAulaHistorialTabla';
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

describe('LmsAulaHistorialTabla', () => {
  it('pone el nombre una vez y las notas bajo cada título', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaHistorialTabla, {
          fichaId: 1,
          filas: [fila({}), fila({ actividad_id: 8, titulo: 'Tarea 2', calificacion: null })],
        }),
      ),
    );
    expect(html.split('ANA LOPEZ').length - 1).toBe(1);
    expect(html).toContain('Guía 1');
    expect(html).toContain('Tarea 2');
    expect(html).toContain('85 / 100');
    expect(html).toContain('Sin nota / 100');
    expect(html).toContain('/lms/aulas/1/actividades/4/aprendices/2');
    expect(html).toContain('/lms/aulas/1/actividades/8/aprendices/2');
  });
});
