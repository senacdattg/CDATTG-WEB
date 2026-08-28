/**
 * @module pages/lms/LmsPublicarCampos.test
 * @description Plazo con calendario y reloj, siempre visibles.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsPublicarPlazo, LmsPublicarPuntos } from './LmsPublicarCampos';

describe('LmsPublicarPlazo', () => {
  it('expone fecha y hora obligatorias', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPublicarPlazo, {
        fecha: '2026-08-30',
        hora: '18:00',
        onFecha: () => undefined,
        onHora: () => undefined,
      }),
    );
    expect(html).toContain('type="date"');
    expect(html).toContain('type="time"');
    expect(html).toContain('required');
    expect(html).toContain('2026-08-30');
    expect(html).toContain('18:00');
    expect(html).not.toContain('lms-con-plazo');
  });
});

describe('LmsPublicarPuntos', () => {
  it('pide los puntos de la actividad', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPublicarPuntos, { puntos: '80', onPuntos: () => undefined }),
    );
    expect(html).toContain('Puntos (0-100)');
    expect(html).toContain('80');
  });
});
