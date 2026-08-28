/**
 * @module pages/lms/LmsAuditoriaNota.test
 * @description Muestra la nota y el comentario del instructor.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAuditoriaNota } from './LmsAuditoriaNota';

describe('LmsAuditoriaNota', () => {
  it('dice si no hay nota', () => {
    const html = renderToStaticMarkup(createElement(LmsAuditoriaNota, { calificacion: null, comentario: '' }));
    expect(html).toContain('Sin nota');
  });

  it('muestra nota y comentario', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAuditoriaNota, { calificacion: 90, comentario: 'Muy bien' }),
    );
    expect(html).toContain('90');
    expect(html).toContain('Muy bien');
  });
});
