/**
 * @module pages/lms/LmsAulaTrabajos.test
 * @description Trabajos de clase lista actividades con plazo.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaTrabajos } from './LmsAulaTrabajos';
import type { LmsActividadItem } from '../../types/lms';

function item(id: number, titulo: string, plazo: string | null): LmsActividadItem {
  return {
    id,
    tipo: 'TABLON',
    titulo,
    cuerpo: '',
    habilita_carga: Boolean(plazo),
    calificacion_max: null,
    plazo_entrega: plazo,
    creado_en: '',
    instructor_nombre: 'ANA',
    archivos: [],
  };
}

describe('LmsAulaTrabajos', () => {
  it('muestra las que tienen plazo y oculta las del tablón sin fecha', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(LmsAulaTrabajos, {
        fichaId: 1,
        actividades: [item(1, 'Guía libre', null), item(2, 'Taller vencido', '2020-01-01T10:00:00')],
      })),
    );
    expect(html).toContain('Taller vencido');
    expect(html).toContain('Vencida');
    expect(html).not.toContain('Guía libre');
  });
});
