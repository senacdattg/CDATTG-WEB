/**
 * @module pages/lms/LmsAuditoriaCarpeta.test
 * @description La tarjeta muestra el nombre de la carpeta y Ver más.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAuditoriaCarpeta } from './LmsAuditoriaCarpeta';

describe('LmsAuditoriaCarpeta', () => {
  it('muestra cédula-nombre y Ver más', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAuditoriaCarpeta, { titulo: '1120 ANA', detalle: 'ANA', to: '/lms/auditoria/1' }),
      ),
    );
    expect(html).toContain('1120 ANA');
    expect(html).toContain('Ver más');
  });
});
