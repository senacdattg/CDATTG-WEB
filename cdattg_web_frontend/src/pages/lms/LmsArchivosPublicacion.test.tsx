/**
 * @module pages/lms/LmsArchivosPublicacion.test
 * @description Adjuntos de la actividad: vacío, PDF o nombre suelto.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsArchivosPublicacion } from './LmsArchivosPublicacion';

describe('LmsArchivosPublicacion', () => {
  it('avisa si no hay archivos', () => {
    const html = renderToStaticMarkup(
      createElement(LmsArchivosPublicacion, { fichaId: 1, actividadId: 2, archivos: [] }),
    );
    expect(html).toContain('Sin archivos adjuntos');
  });

  it('nombra archivos que no son PDF', () => {
    const html = renderToStaticMarkup(
      createElement(LmsArchivosPublicacion, {
        fichaId: 1,
        actividadId: 2,
        archivos: [{ id: 9, nombre: 'guia.docx', tamano: 4 }],
      }),
    );
    expect(html).toContain('guia.docx');
    expect(html).not.toContain('Cargando vista previa');
  });
});
