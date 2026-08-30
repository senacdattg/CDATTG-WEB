/**
 * @module pages/lms/LmsEntregaFila.test
 * @description El superadmin mira la nota y no puede guardarla.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsEntregaFila } from './LmsEntregaFila';
import type { LmsEntregaItem } from '../../types/lms';

const entrega: LmsEntregaItem = {
  id: 8,
  aprendiz_id: 2,
  aprendiz_nombre: 'ANA',
  documento: '1089',
  entregado_en: '2026-08-20T10:00:00',
  tardia: false,
  calificacion: 85,
  comentario_instructor: 'Bien',
  archivos: [],
};

describe('LmsEntregaFila', () => {
  it('en solo lectura muestra la nota y oculta Guardar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsEntregaFila, {
        fichaId: 1,
        actividadId: 4,
        puntos: 100,
        entrega,
        saving: false,
        soloLectura: true,
        onCalificar: vi.fn(),
      }),
    );
    expect(html).toContain('Nota del instructor: 85');
    expect(html).toContain('Bien');
    expect(html).not.toContain('Guardar nota');
  });

  it('el instructor sí ve el formulario', () => {
    const html = renderToStaticMarkup(
      createElement(LmsEntregaFila, {
        fichaId: 1,
        actividadId: 4,
        puntos: 100,
        entrega,
        saving: false,
        onCalificar: vi.fn(),
      }),
    );
    expect(html).toContain('Guardar nota');
    expect(html).toContain('Nota (0-100)');
  });
});
