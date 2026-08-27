/**
 * @module pages/lms/LmsPublicarActividadForm.test
 * @description Prefill del formulario al editar una actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsPublicarActividadForm } from './LmsPublicarActividadForm';

describe('LmsPublicarActividadForm', () => {
  it('en alta pide publicar en el tablón', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPublicarActividadForm, { saving: false, onSubmit: async () => undefined }),
    );
    expect(html).toContain('Publicar actividad');
    expect(html).toContain('Publicar en el tablón');
  });

  it('en edición rellena título, puntos y guardar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPublicarActividadForm, {
        saving: false,
        onSubmit: async () => undefined,
        initial: {
          titulo: 'Guía 2',
          cuerpo: 'Leer',
          calificacion_max: 80,
          plazo_entrega: '2026-08-30T23:00:00-05:00',
        },
      }),
    );
    expect(html).toContain('Editar actividad');
    expect(html).toContain('Guía 2');
    expect(html).toContain('80');
    expect(html).toContain('Guardar cambios');
    expect(html).toContain('2026-08-30');
  });
});
