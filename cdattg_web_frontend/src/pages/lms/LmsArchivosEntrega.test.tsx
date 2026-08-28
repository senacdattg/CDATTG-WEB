/**
 * @module pages/lms/LmsArchivosEntrega.test
 * @description Texto vacío cuando la entrega no tiene PDF.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsArchivosEntrega } from './LmsArchivosEntrega';

describe('LmsArchivosEntrega', () => {
  it('muestra el aviso si no hay archivos', () => {
    const html = renderToStaticMarkup(
      createElement(LmsArchivosEntrega, {
        fichaId: 1,
        actividadId: 2,
        entregaId: 3,
        archivos: [],
        vacio: 'Aún no ha adjuntado archivos.',
      }),
    );
    expect(html).toContain('Aún no ha adjuntado archivos.');
  });
});
