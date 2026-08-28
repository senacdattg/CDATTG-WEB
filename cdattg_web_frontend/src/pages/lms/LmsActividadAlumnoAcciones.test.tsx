/**
 * @module pages/lms/LmsActividadAlumnoAcciones.test
 * @description Entregar, deshacer o solo consulta.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsActividadAlumnoAcciones } from './LmsActividadAlumnoAcciones';

const base = {
  saving: false,
  etiqueta: 'Entregar',
  tieneArchivos: false,
  onElegir: () => undefined,
  onEnviar: () => undefined,
  onDeshacer: () => undefined,
};

describe('LmsActividadAlumnoAcciones', () => {
  it('muestra adjuntar si puede entregar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsActividadAlumnoAcciones, { ...base, puedeEntregar: true, entregada: false }),
    );
    expect(html).toContain('Adjuntar PDF');
    expect(html).toContain('Entregar');
  });

  it('muestra deshacer si ya envió', () => {
    const html = renderToStaticMarkup(
      createElement(LmsActividadAlumnoAcciones, { ...base, puedeEntregar: true, entregada: true }),
    );
    expect(html).toContain('Deshacer entrega');
    expect(html).not.toContain('Adjuntar PDF');
  });

  it('avisa si solo consulta', () => {
    const html = renderToStaticMarkup(
      createElement(LmsActividadAlumnoAcciones, { ...base, puedeEntregar: false, entregada: true }),
    );
    expect(html).toContain('Solo consulta');
  });
});
