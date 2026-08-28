/**
 * @module pages/lms/LmsMisActividadBorrar.test
 * @description Segunda fase: confirmar el borrado.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsMisActividadBorrar } from './LmsMisActividadBorrar';

describe('LmsMisActividadBorrar', () => {
  it('pide estar seguro y nombra la actividad', () => {
    const html = renderToStaticMarkup(
      createElement(LmsMisActividadBorrar, {
        titulo: 'Guía 1',
        saving: false,
        onConfirmar: async () => undefined,
        onCancelar: () => undefined,
      }),
    );
    expect(html).toContain('¿Eliminar esta actividad?');
    expect(html).toContain('Guía 1');
    expect(html).toContain('Cancelar');
    expect(html).toContain('Sí, eliminar');
  });

  it('cambia el texto mientras elimina', () => {
    const html = renderToStaticMarkup(
      createElement(LmsMisActividadBorrar, {
        titulo: 'Guía 1',
        saving: true,
        onConfirmar: async () => undefined,
        onCancelar: () => undefined,
      }),
    );
    expect(html).toContain('Eliminando…');
  });
});
