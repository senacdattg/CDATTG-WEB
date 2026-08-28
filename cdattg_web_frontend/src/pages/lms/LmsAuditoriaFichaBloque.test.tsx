/**
 * @module pages/lms/LmsAuditoriaFichaBloque.test
 * @description Carpeta de ficha vacía o con entregas.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAuditoriaFichaBloque } from './LmsAuditoriaFichaBloque';
import type { LmsAuditoriaFichaItem } from '../../types/lmsAuditoria';

const ficha: LmsAuditoriaFichaItem = {
  ficha_id: 21,
  numero_ficha: '3173334',
  nombre_programa: 'ADSO',
  nombre_carpeta: '3173334 ADSO',
  actividades: [],
};

describe('LmsAuditoriaFichaBloque', () => {
  it('dice si no hay actividades', () => {
    const html = renderToStaticMarkup(createElement(LmsAuditoriaFichaBloque, { ficha }));
    expect(html).toContain('3173334 ADSO');
    expect(html).toContain('Aún no hay actividades cargadas');
  });

  it('muestra la nota que puso el instructor', () => {
    const conNota = {
      ...ficha,
      actividades: [
        {
          actividad_id: 1,
          ficha_id: 21,
          entrega_id: 8,
          titulo: 'Guía 1',
          entregado_en: '2026-01-01T00:00:00Z',
          calificacion: 85,
          comentario_instructor: 'Bien',
          archivos: [],
        },
      ],
    };
    const html = renderToStaticMarkup(createElement(LmsAuditoriaFichaBloque, { ficha: conNota }));
    expect(html).toContain('Guía 1');
    expect(html).toContain('85');
    expect(html).toContain('Bien');
  });
});
