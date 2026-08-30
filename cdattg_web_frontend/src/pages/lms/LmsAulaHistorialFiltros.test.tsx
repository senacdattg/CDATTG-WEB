/**
 * @module pages/lms/LmsAulaHistorialFiltros.test
 * @description Pinta el recorte por aprendiz.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsAulaHistorialFiltros } from './LmsAulaHistorialFiltros';

describe('LmsAulaHistorialFiltros', () => {
  it('muestra el recuadro de aprendiz', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaHistorialFiltros, {
        aprendiz: '',
        onAprendiz: vi.fn(),
      }),
    );
    expect(html).toContain('Filtrar por aprendiz');
    expect(html).toContain('Nombre del aprendiz');
  });
});
