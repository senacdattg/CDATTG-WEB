/**
 * @module pages/lms/LmsAuditoriaFichas.test
 * @description Al buscar por ficha se ve la tarjeta con Ver más y Auditar.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LmsAuditoriaFichas } from './LmsAuditoriaFichas';
import type { LmsAulaListItem } from '../../types/lms';

const aula: LmsAulaListItem = {
  ficha_id: 21,
  numero_ficha: '3424052',
  nombre_programa: 'Gestion De La Seguridad',
  tipo_formacion: 'FORMACION_REGULAR',
  puede_publicar: false,
  cantidad_aprendices: 31,
  instructor_nombre: 'Eliana Pilar',
};

describe('LmsAuditoriaFichas', () => {
  it('muestra la tarjeta con Ver más y Auditar', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAuditoriaFichas, { fichas: [aula], onVerFicha: vi.fn() }),
      ),
    );
    expect(html).toContain('3424052');
    expect(html).toContain('Ver más');
    expect(html).toContain('Auditar');
    expect(html).toContain('/lms/auditoria/ficha/21');
  });
});
