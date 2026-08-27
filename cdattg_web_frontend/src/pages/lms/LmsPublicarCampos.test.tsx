/**
 * @module pages/lms/LmsPublicarCampos.test
 * @description Plazo con calendario y reloj (también se escribe).
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsPublicarPlazo, LmsPublicarPuntos } from './LmsPublicarCampos';

describe('LmsPublicarPlazo', () => {
  it('expone input date y time cuando hay plazo', () => {
    const html = renderToStaticMarkup(
      createElement(LmsPublicarPlazo, {
        conPlazo: true,
        fecha: '2026-08-30',
        hora: '18:00',
        onToggle: () => undefined,
        onFecha: () => undefined,
        onHora: () => undefined,
      }),
    );
    expect(html).toContain('type="date"');
    expect(html).toContain('type="time"');
    expect(html).toContain('2026-08-30');
    expect(html).toContain('18:00');
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
