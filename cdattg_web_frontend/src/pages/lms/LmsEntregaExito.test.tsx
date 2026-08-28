/**
 * @module pages/lms/LmsEntregaExito.test
 * @description Overlay de entrega, publicación, actualización y borrado.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsEntregaExito } from './LmsEntregaExito';

describe('LmsEntregaExito', () => {
  it('no pinta nada si está oculto', () => {
    const html = renderToStaticMarkup(createElement(LmsEntregaExito, { visible: false }));
    expect(html).toBe('');
  });

  it('celebra la entrega', () => {
    const html = renderToStaticMarkup(createElement(LmsEntregaExito, { visible: true }));
    expect(html).toContain('Entrega exitosa');
    expect(html).toContain('Su trabajo quedó registrado.');
  });

  it('confirma que se deshizo', () => {
    const html = renderToStaticMarkup(createElement(LmsEntregaExito, { visible: true, variante: 'deshacer' }));
    expect(html).toContain('Entrega deshecha');
    expect(html).toContain('Puede adjuntar de nuevo y enviar.');
    expect(html).not.toContain('Entrega exitosa');
  });

  it('celebra la actividad publicada', () => {
    const html = renderToStaticMarkup(createElement(LmsEntregaExito, { visible: true, variante: 'publicada' }));
    expect(html).toContain('Actividad realizada con éxito');
    expect(html).toContain('Ya está visible en el aula.');
  });

  it('confirma la actualización', () => {
    const html = renderToStaticMarkup(createElement(LmsEntregaExito, { visible: true, variante: 'actualizada' }));
    expect(html).toContain('Actividad actualizada');
    expect(html).toContain('Los cambios ya están visibles en el aula.');
  });

  it('confirma la eliminación', () => {
    const html = renderToStaticMarkup(createElement(LmsEntregaExito, { visible: true, variante: 'eliminada' }));
    expect(html).toContain('Actividad eliminada');
    expect(html).toContain('Ya no aparece en el aula.');
  });
});
