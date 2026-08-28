/**
 * @module pages/lms/LmsAuditoriaLista.test
 * @description El listado muestra carpetas raíz o el vacío.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAuditoriaLista } from './LmsAuditoriaLista';

describe('LmsAuditoriaLista', () => {
  it('avisa si no hay resultados', () => {
    const html = renderToStaticMarkup(createElement(LmsAuditoriaLista, { personas: [] }));
    expect(html).toContain('No hay carpetas');
  });

  it('lista la carpeta de la persona', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAuditoriaLista, {
          personas: [{ persona_id: 1, documento: '1120', nombre: 'ANA', nombre_carpeta: '1120 ANA' }],
        }),
      ),
    );
    expect(html).toContain('1120 ANA');
    expect(html).toContain('Ver más');
  });
});
