/**
 * @module pages/lms/LmsMisActividadEditar.test
 * @description Edición amplia con Cancelar, sin Ver ni Eliminar.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsMisActividadEditar } from './LmsMisActividadEditar';
import type { LmsActividadItem } from '../../types/lms';

const actividad: LmsActividadItem = {
  id: 4,
  tipo: 'TABLON',
  titulo: 'Guía 1',
  cuerpo: 'Leer',
  habilita_carga: true,
  calificacion_max: 80,
  plazo_entrega: null,
  creado_en: '',
  archivos: [],
};

describe('LmsMisActividadEditar', () => {
  it('abre el formulario a ancho completo', () => {
    const html = renderToStaticMarkup(
      createElement(LmsMisActividadEditar, {
        fichaId: 1,
        actividad,
        saving: false,
        onGuardar: async () => undefined,
        onCerrar: () => undefined,
      }),
    );
    expect(html).toContain('Editar actividad');
    expect(html).toContain('Guía 1');
    expect(html).toContain('Cancelar');
    expect(html).not.toContain('Sí, eliminar');
  });
});
