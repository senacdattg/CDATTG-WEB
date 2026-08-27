/**
 * @module pages/lms/LmsFichaDetalleModal.test
 * @description Overlay Ver más usa un dialog nativo.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsFichaDetalleModal } from './LmsFichaDetalleModal';

vi.mock('../ficha-detalle/FichaDetalleEmbedded', () => ({
  FichaDetalleEmbedded: () => createElement('p', null, 'detalle'),
}));

describe('LmsFichaDetalleModal', () => {
  it('renderiza un dialog con el detalle embebido', () => {
    const html = renderToStaticMarkup(
      createElement(LmsFichaDetalleModal, { fichaId: 21, onClose: vi.fn() }),
    );
    expect(html).toContain('<dialog');
    expect(html).toContain('Detalle de la ficha');
    expect(html).toContain('detalle');
  });
});
