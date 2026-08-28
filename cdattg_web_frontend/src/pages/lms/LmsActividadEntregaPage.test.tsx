/**
 * @module pages/lms/LmsActividadEntregaPage.test
 * @description La entrega muestra nota y vuelve a aprendices.
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
      calificacion_max: 100,
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
    calificar: async () => undefined,
  }),
}));

import { LmsActividadEntregaPage } from './LmsActividadEntregaPage';

describe('LmsActividadEntregaPage', () => {
  it('muestra al aprendiz y el formulario de nota', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/lms/aulas/1/actividades/4/aprendices/2'] },
        createElement(
          Routes,
          null,
          createElement(Route, {
            path: '/lms/aulas/:fichaId/actividades/:actividadId/aprendices/:aprendizId',
            element: createElement(LmsActividadEntregaPage),
          }),
        ),
      ),
    );
    expect(html).toContain('CARLOS');
    expect(html).toContain('Nota (0-100)');
    expect(html).toContain('/lms/aulas/1/actividades/4/aprendices');
  });
});
