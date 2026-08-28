/**
 * @module pages/lms/LmsAulaTablon.test
 * @description Pendientes: aprendiz lo que falta; instructor lo que no está vencido.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaTablon } from './LmsAulaTablon';
import type { LmsActividadItem } from '../../types/lms';

const item = (id: number, titulo: string, entregada = false, plazo: string | null = null): LmsActividadItem => ({
  id,
  tipo: 'TABLON',
  titulo,
  cuerpo: 'Descripción',
  habilita_carga: true,
  calificacion_max: null,
  plazo_entrega: plazo,
  creado_en: '',
  instructor_nombre: 'ANA',
  archivos: [],
  entregada,
});

describe('LmsAulaTablon', () => {
  it('oculta las ya entregadas al aprendiz', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaTablon, {
          fichaId: 1,
          puedePublicar: false,
          actividades: [item(1, 'Guía 1'), item(2, 'Ya enviada', true)],
        }),
      ),
    );
    expect(html).toContain('Guía 1');
    expect(html).not.toContain('Ya enviada');
  });

  it('el instructor ve las abiertas y las sin fecha, no las vencidas', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaTablon, {
          fichaId: 1,
          puedePublicar: true,
          onAbrirEditar: () => undefined,
          actividades: [
            item(1, 'Abierta', false, '2099-01-01T10:00:00'),
            item(2, 'Vencida', false, '2020-01-01T10:00:00'),
            item(3, 'Sin fecha', false, null),
          ],
        }),
      ),
    );
    expect(html).toContain('Abierta');
    expect(html).not.toContain('Vencida');
    expect(html).toContain('Sin fecha');
    expect(html).toContain('Sin fecha de vencimiento');
    expect(html).not.toContain('/lms/aulas/1/actividades/');
    expect(html).not.toContain('Editar actividad');
  });

  it('la vista del instructor muestra Editar y no la lista', () => {
    const html = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(LmsAulaTablon, {
          fichaId: 1,
          puedePublicar: true,
          onAbrirEditar: () => undefined,
          verInicial: 3,
          actividades: [item(1, 'Abierta', false, '2099-01-01T10:00:00'), item(3, 'Sin fecha', false, null)],
        }),
      ),
    );
    expect(html).toContain('Sin fecha');
    expect(html).toContain('Editar actividad');
    expect(html).toContain('Volver');
    expect(html).not.toContain('Abierta');
  });
});
