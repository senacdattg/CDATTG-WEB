/**
 * @module pages/lms/LmsEditarActividadPanel.test
 * @description El instructor ve el botón para editar la actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsEditarActividadPanel } from './LmsEditarActividadPanel';
import type { LmsActividadDetalle } from '../../types/lms';

const detalle: LmsActividadDetalle = {
  id: 4,
  tipo: 'TABLON',
  titulo: 'Guía',
  cuerpo: 'Leer el PDF',
  habilita_carga: true,
  calificacion_max: 80,
  plazo_entrega: '2026-08-30T23:00:00-05:00',
  creado_en: '',
  instructor_nombre: 'ANA',
  archivos: [],
  puede_publicar: true,
  mi_entrega: null,
  entregas: [],
};

describe('LmsEditarActividadPanel', () => {
  it('muestra el botón Editar actividad cerrado', () => {
    const html = renderToStaticMarkup(
      createElement(LmsEditarActividadPanel, {
        detalle,
        saving: false,
        onSubmit: async () => undefined,
      }),
    );
    expect(html).toContain('Editar actividad');
    expect(html).not.toContain('Guardar cambios');
  });
});
