/**
 * @module pages/lms/LmsIndexPage.test
 * @description El índice LMS redirige a Mis aulas.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsIndexPage } from './LmsIndexPage';

describe('LmsIndexPage', () => {
  it('redirige a /lms/aulas', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(LmsIndexPage)),
    );
    expect(html).toBe('');
  });
});
