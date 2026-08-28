/**
 * @module pages/lms/LmsActividadAprendicesPage.test
 * @description Ver más lista aprendices y pide volver al aula.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./useLmsActividad', () => ({
  useLmsActividad: () => ({
    detalle: {
      id: 4,
      titulo: 'Guía 1',
      puede_publicar: true,
      entregas: [
        {
          id: 8,
          aprendiz_id: 2,
          aprendiz_nombre: 'CARLOS',
          documento: '1089',
          entregado_en: '2026-08-20T10:00:00',
          tardia: false,
          calificacion: null,
          comentario_instructor: '',
          archivos: [],
        },
      ],
    },
    loading: false,
    error: '',
    saving: false,
  }),
}));

import { LmsActividadAprendicesPage } from './LmsActividadAprendicesPage';

describe('LmsActividadAprendicesPage', () => {
  it('lista aprendices con Ver actividad', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/lms/aulas/1/actividades/4/aprendices'] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: '/lms/aulas/:fichaId/actividades/:actividadId/aprendices',
            element: createElement(LmsActividadAprendicesPage),
          }),
        ),
      ),
    );
    expect(html).toContain('Guía 1');
    expect(html).toContain('CARLOS');
    expect(html).toContain('Ver actividad');
    expect(html).toContain('/lms/aulas/1');
  });
});
