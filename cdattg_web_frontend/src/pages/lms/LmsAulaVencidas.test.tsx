/**
 * @module pages/lms/LmsAulaVencidas.test
 * @description El aprendiz ve solo las que no entregó y ya vencieron.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaVencidas } from './LmsAulaVencidas';
import type { LmsActividadItem } from '../../types/lms';

function item(id: number, titulo: string, plazo: string | null, entregada = false): LmsActividadItem {
  return {
    id,
    tipo: 'TABLON',
    titulo,
    cuerpo: '',
    habilita_carga: true,
    calificacion_max: null,
    plazo_entrega: plazo,
    creado_en: '',
    archivos: [],
    entregada,
  };
}

describe('LmsAulaVencidas', () => {
  it('muestra la vencida sin entrega y oculta la enviada', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaVencidas, {
          fichaId: 1,
          actividades: [
            item(1, 'Se pasó', '2020-01-01T10:00:00'),
            item(2, 'Enviada tarde', '2020-01-01T10:00:00', true),
            item(3, 'Aún abierta', '2099-01-01T10:00:00'),
          ],
        }),
      ),
    );
    expect(html).toContain('Se pasó');
    expect(html).not.toContain('Enviada tarde');
    expect(html).not.toContain('Aún abierta');
  });

  it('muestra el vacío si no hay vencidas', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaVencidas, {
          fichaId: 1,
          actividades: [item(3, 'Aún abierta', '2099-01-01T10:00:00')],
        }),
      ),
    );
    expect(html).toContain('No hay actividades vencidas.');
  });
});
