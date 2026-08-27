/**
 * @module pages/lms/LmsFichaModal.test
 * @description Modal de ficha en Mis aulas.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsFichaModal } from './LmsFichaModal';

vi.mock('./LmsFichaDetalleModal', () => ({
  LmsFichaDetalleModal: ({ fichaId }: { fichaId: number }) =>
    createElement('p', null, `ficha-${fichaId}`),
}));

describe('LmsFichaModal', () => {
  it('no pinta nada sin id', () => {
    const html = renderToStaticMarkup(
      createElement(LmsFichaModal, { fichaId: null, onClose: () => undefined }),
    );
    expect(html).toBe('');
  });

  it('pinta el detalle con id', () => {
    const html = renderToStaticMarkup(
      createElement(LmsFichaModal, { fichaId: 7, onClose: () => undefined }),
    );
    expect(html).toContain('ficha-7');
  });
});
