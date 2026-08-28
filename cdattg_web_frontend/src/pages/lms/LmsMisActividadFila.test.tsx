/**
 * @module pages/lms/LmsMisActividadFila.test
 * @description Tarjeta con Ver, Editar y Eliminar a ancho completo.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsMisActividadFila } from './LmsMisActividadFila';
import type { LmsActividadItem } from '../../types/lms';

const actividad: LmsActividadItem = {
  id: 4,
  tipo: 'TABLON',
  titulo: 'Guía 1',
  cuerpo: '',
  habilita_carga: true,
  calificacion_max: 100,
  plazo_entrega: null,
  creado_en: '',
  instructor_nombre: 'ANA',
  archivos: [],
};

describe('LmsMisActividadFila', () => {
  it('tiene Ver, Editar y Eliminar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsMisActividadFila, {
        actividad,
        onVer: () => undefined,
        onEditar: () => undefined,
        onEliminar: () => undefined,
      }),
    );
    expect(html).toContain('Guía 1');
    expect(html).toContain('Ver');
    expect(html).toContain('Editar');
    expect(html).toContain('Eliminar');
    expect(html).toContain('grid-cols-1');
  });
});
