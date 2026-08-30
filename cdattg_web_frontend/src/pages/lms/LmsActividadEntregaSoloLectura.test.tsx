/**
 * @module pages/lms/LmsActividadEntregaSoloLectura.test
 * @description El superadmin abre la entrega y no puede guardar nota.
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
      puede_publicar: false,
      puede_ver_historial: true,
      calificacion_max: 100,
      entregas: [
        {
          id: 8,
          aprendiz_id: 2,
          aprendiz_nombre: 'CARLOS',
          documento: '1089',
          entregado_en: '2026-08-20T10:00:00',
          tardia: false,
          calificacion: 85,
          comentario_instructor: 'Bien',
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

describe('LmsActividadEntregaPage solo lectura', () => {
  it('muestra la nota y oculta Guardar', () => {
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
    expect(html).toContain('Nota del instructor: 85');
    expect(html).not.toContain('Guardar nota');
  });
});
