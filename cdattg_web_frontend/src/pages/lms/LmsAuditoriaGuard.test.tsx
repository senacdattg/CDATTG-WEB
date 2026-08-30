/**
 * @module pages/lms/LmsAuditoriaGuard.test
 * @description El instructor no entra; el superadmin sí.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const auth = { roles: [] as string[] };
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => auth,
}));

import { LmsAuditoriaGuard } from './LmsAuditoriaGuard';

describe('LmsAuditoriaGuard', () => {
  it('saca al instructor hacia Mis aulas', () => {
    auth.roles = ['INSTRUCTOR'];
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/lms/auditoria'] }, createElement(LmsAuditoriaGuard)),
    );
    expect(html).not.toContain('Auditoría');
  });

  it('deja pasar al superadministrador', () => {
    auth.roles = ['SUPER ADMINISTRADOR'];
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, { initialEntries: ['/lms/auditoria'] }, createElement(LmsAuditoriaGuard)),
    );
    expect(html).not.toContain('/lms/aulas');
  });
});
