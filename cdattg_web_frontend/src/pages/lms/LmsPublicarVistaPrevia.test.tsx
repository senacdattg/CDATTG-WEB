/**
 * @module pages/lms/LmsPublicarVistaPrevia.test
 * @description Solo muestra PDF locales; el resto no pinta nada.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsPublicarVistaPrevia } from './LmsPublicarVistaPrevia';

describe('LmsPublicarVistaPrevia', () => {
  it('no pinta nada si no hay archivos', () => {
    const html = renderToStaticMarkup(createElement(LmsPublicarVistaPrevia, { files: [] }));
    expect(html).toBe('');
  });

  it('ignora archivos que no son PDF', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPublicarVistaPrevia, { files: [new File(['x'], 'guia.docx')] }),
    );
    expect(html).toBe('');
  });
});
