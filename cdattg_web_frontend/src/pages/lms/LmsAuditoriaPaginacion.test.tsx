/**
 * @module pages/lms/LmsAuditoriaPaginacion.test
 * @description La paginación aparece cuando hay más de 20 carpetas.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsAuditoriaPaginacion } from './LmsAuditoriaPaginacion';

describe('LmsAuditoriaPaginacion', () => {
  it('no se muestra si cabe en una página', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAuditoriaPaginacion, { page: 1, total: 20, onPage: vi.fn() }),
    );
    expect(html).toBe('');
  });

  it('muestra el rango y Siguiente en la página 1 de 21', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAuditoriaPaginacion, { page: 1, total: 21, onPage: vi.fn() }),
    );
    expect(html).toContain('Mostrando 1 a 20 de 21');
    expect(html).toContain('Siguiente');
  });
});
