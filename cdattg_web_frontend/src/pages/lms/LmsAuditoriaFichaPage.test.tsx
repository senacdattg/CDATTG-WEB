/**
 * @module pages/lms/LmsAuditoriaFichaPage.test
 * @description La página de ficha pide volver a auditoría.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./useLmsAuditoriaFicha', () => ({
  useLmsAuditoriaFicha: () => ({ personas: [], error: '' }),
}));

import { LmsAuditoriaFichaPage } from './LmsAuditoriaFichaPage';

describe('LmsAuditoriaFichaPage', () => {
  it('muestra el título y el enlace de volver', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        { initialEntries: ['/lms/auditoria/ficha/21'] },
        createElement(
          Routes,
          null,
          createElement(Route, { path: '/lms/auditoria/ficha/:fichaId', element: createElement(LmsAuditoriaFichaPage) }),
        ),
      ),
    );
    expect(html).toContain('Carpetas de la ficha');
    expect(html).toContain('/lms/auditoria');
  });
});
