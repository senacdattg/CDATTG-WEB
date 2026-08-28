/**
 * @module pages/lms/LmsAuditoriaPage.test
 * @description Al abrir auditoría ya se ven carpetas raíz debajo del filtro.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./useLmsAuditoria', () => ({
  useLmsAuditoria: () => ({
    fichas: [],
    personas: [{ persona_id: 1, documento: '1120', nombre: 'ANA', nombre_carpeta: '1120 ANA' }],
    total: 21,
    loading: false,
    error: '',
  }),
}));

import { LmsAuditoriaPage } from './LmsAuditoriaPage';

describe('LmsAuditoriaPage', () => {
  it('lista carpetas debajo de la lupa y pagina de a 20', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(LmsAuditoriaPage)));
    expect(html).toContain('Auditoría LMS');
    expect(html).toContain('lms-auditoria-q');
    expect(html).toContain('1120 ANA');
    expect(html).toContain('Mostrando 1 a 20 de 21 carpetas');
    expect(html).toContain('Siguiente');
  });
});
