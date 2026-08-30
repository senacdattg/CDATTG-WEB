/**
 * @module pages/lms/LmsAulaTabs.test
 * @description Publicar actividad solo si puede publicar.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsAulaTabs } from './LmsAulaTabs';
import { LMS_TABS } from './lmsConstants';

describe('LmsAulaTabs', () => {
  it('oculta Publicar actividad al aprendiz', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaTabs, { tab: LMS_TABS.tablon, onTab: vi.fn(), puedePublicar: false }),
    );
    expect(html).toContain('Actividades pendientes');
    expect(html).not.toContain('Publicar actividad');
    expect(html).not.toContain('Mis actividades');
    expect(html).not.toContain('Historial de actividades');
  });

  it('muestra Publicar actividad al instructor', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaTabs, { tab: LMS_TABS.tablon, onTab: vi.fn(), puedePublicar: true }),
    );
    expect(html).toContain('Publicar actividad');
    expect(html).toContain('Mis actividades');
    expect(html).toContain('Historial de actividades');
  });
});
