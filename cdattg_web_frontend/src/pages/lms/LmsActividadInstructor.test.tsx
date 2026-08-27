/**
 * @module pages/lms/LmsActividadInstructor.test
 * @description El instructor ve entregas y puede calificar 0-100.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsActividadInstructor } from './LmsActividadInstructor';
import type { LmsActividadDetalle } from '../../types/lms';

const detalle: LmsActividadDetalle = {
  id: 4,
  tipo: 'TABLON',
  titulo: 'Guía',
  cuerpo: '',
  habilita_carga: true,
  calificacion_max: 100,
  plazo_entrega: null,
  creado_en: '',
  instructor_nombre: 'ANA',
  archivos: [],
  puede_publicar: true,
  mi_entrega: null,
  entregas: [
    {
      id: 8,
      aprendiz_id: 2,
      aprendiz_nombre: 'CARLOS CAICEDO',
      documento: '1089',
      entregado_en: '2026-08-20T10:00:00',
      tardia: false,
      calificacion: null,
      comentario_instructor: '',
      archivos: [{ id: 1, nombre: 'guia.pdf', tamano: 10 }],
    },
  ],
};

describe('LmsActividadInstructor', () => {
  it('lista envíos con nota y comentario', () => {
    const html = renderToStaticMarkup(
      createElement(LmsActividadInstructor, {
        fichaId: 1,
        detalle,
        saving: false,
        onCalificar: async () => undefined,
      }),
    );
    expect(html).toContain('Entregas de aprendices');
    expect(html).toContain('CARLOS CAICEDO');
    expect(html).toContain('Nota (0-100)');
    expect(html).toContain('Comentario');
    expect(html).toContain('guia.pdf');
  });
});
