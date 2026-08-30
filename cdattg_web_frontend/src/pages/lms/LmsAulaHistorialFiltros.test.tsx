/**
 * @module pages/lms/LmsAulaHistorialFiltros.test
 * @description Pinta los tres recortes y la lista de actividades.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsAulaHistorialFiltros } from './LmsAulaHistorialFiltros';

describe('LmsAulaHistorialFiltros', () => {
  it('muestra aprendiz, lista de actividades y estados', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaHistorialFiltros, {
        aprendiz: '',
        actividadId: null,
        actividades: [
          { actividadId: 4, titulo: 'Guía 1' },
          { actividadId: 8, titulo: 'Tarea 2' },
        ],
        estado: 'todos',
        onAprendiz: vi.fn(),
        onActividad: vi.fn(),
        onEstado: vi.fn(),
      }),
    );
    expect(html).toContain('Filtrar por aprendiz');
    expect(html).toContain('Filtrar por actividad');
    expect(html).toContain('Todas las actividades');
    expect(html).toContain('<select');
    expect(html).toContain('Guía 1');
    expect(html).toContain('Tarea 2');
    expect(html).not.toContain('placeholder="Título de la actividad');
    expect(html).toContain('Activos');
    expect(html).toContain('Ocultos en asistencia');
  });
});
