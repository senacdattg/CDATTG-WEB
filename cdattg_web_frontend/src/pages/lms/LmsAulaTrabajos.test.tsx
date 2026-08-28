/**
 * @module pages/lms/LmsAulaTrabajos.test
 * @description Trabajos de clase: entregados del aprendiz o con envíos del instructor.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaTrabajos } from './LmsAulaTrabajos';
import type { LmsActividadItem } from '../../types/lms';

function item(id: number, titulo: string, plazo: string | null, entregada = false, cantidad = 0): LmsActividadItem {
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
    entregada,
    cantidad_entregas: cantidad,
  };
}

describe('LmsAulaTrabajos', () => {
  it('el aprendiz solo ve las ya entregadas', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaTrabajos, {
          fichaId: 1,
          puedePublicar: false,
          actividades: [item(1, 'Pendiente', null, false), item(2, 'Enviada', '2020-01-01T10:00:00', true)],
        }),
      ),
    );
    expect(html).toContain('Enviada');
    expect(html).not.toContain('Pendiente');
  });

  it('el instructor muestra Ver más en las que ya tienen envíos', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaTrabajos, {
          fichaId: 1,
          puedePublicar: true,
          actividades: [item(1, 'Sin envíos', '2020-01-01T10:00:00', false, 0), item(2, 'Con envío', null, false, 2)],
        }),
      ),
    );
    expect(html).toContain('Con envío');
    expect(html).toContain('Ver más');
    expect(html).toContain('/lms/aulas/1/actividades/2/aprendices');
    expect(html).not.toContain('Sin envíos');
  });
});
