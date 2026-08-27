/**
 * @module pages/lms/LmsAulaTablon.test
 * @description El tablón lista todas las publicaciones del aula.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaTablon } from './LmsAulaTablon';
import type { LmsActividadItem } from '../../types/lms';

const item = (id: number, titulo: string): LmsActividadItem => ({
  id,
  tipo: 'TABLON',
  titulo,
  cuerpo: 'Descripción',
  habilita_carga: false,
  calificacion_max: null,
  plazo_entrega: null,
  creado_en: '',
  instructor_nombre: 'ANA',
  archivos: [],
});

describe('LmsAulaTablon', () => {
  it('lista las guías publicadas', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(LmsAulaTablon, {
        fichaId: 1,
        actividades: [item(1, 'Guía 1'), item(2, 'Material')],
      })),
    );
    expect(html).toContain('Guía 1');
    expect(html).toContain('Material');
  });
});
