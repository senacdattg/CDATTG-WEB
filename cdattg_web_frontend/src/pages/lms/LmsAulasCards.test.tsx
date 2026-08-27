/**
 * @module pages/lms/LmsAulasCards.test
 * @description Acciones Ver más y Entrar al aula.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsAulaCard } from './LmsAulasCards';
import type { LmsAulaListItem } from '../../types/lms';

const aula: LmsAulaListItem = {
  ficha_id: 21,
  numero_ficha: '3424052',
  nombre_programa: 'ADSO',
  tipo_formacion: 'FORMACION_REGULAR',
  puede_publicar: true,
  cantidad_aprendices: 10,
};

describe('LmsAulaCard', () => {
  it('muestra Ver más y el enlace al aula', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaCard, { aula, onVerFicha: vi.fn() }),
      ),
    );
    expect(html).toContain('Ver más');
    expect(html).toContain('Entrar al aula');
    expect(html).toContain('/lms/aulas/21');
  });
});
