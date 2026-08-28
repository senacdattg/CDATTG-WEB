/**
 * @module pages/lms/LmsPdfVista.test
 * @description Vista previa plegable y enlace sin descargar.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { etiquetaVistaPdf, LmsPdfVista } from './LmsPdfVista';

describe('etiquetaVistaPdf', () => {
  it('cambia el texto al plegar', () => {
    expect(etiquetaVistaPdf(true)).toBe('Ocultar vista previa');
    expect(etiquetaVistaPdf(false)).toBe('Mostrar vista previa');
  });
});

describe('LmsPdfVista', () => {
  it('muestra iframe y enlace sin download', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPdfVista, { titulo: 'ev.pdf', blobUrl: 'blob:http://local/pdf' }),
    );
    expect(html).toContain('ev.pdf');
    expect(html).toContain('Abrir PDF');
    expect(html).toContain('Ocultar vista previa');
    expect(html).toContain('iframe');
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain('download');
  });

  it('oculta el iframe si nace plegada', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPdfVista, { titulo: 'ev.pdf', blobUrl: 'blob:http://local/pdf', inicialAbierta: false }),
    );
    expect(html).toContain('Mostrar vista previa');
    expect(html).not.toContain('iframe');
    expect(html).toContain('Abrir PDF');
  });
});
