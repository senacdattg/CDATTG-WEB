/**
 * @module pages/lms/LmsMisActividadVer.test
 * @description Lectura a ancho completo con Volver.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsMisActividadVer } from './LmsMisActividadVer';
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
  archivos: [],
};

describe('LmsMisActividadVer', () => {
  it('muestra título, puntos y Volver', () => {
    const html = renderToStaticMarkup(
      createElement(LmsMisActividadVer, { fichaId: 1, actividad, onCerrar: () => undefined }),
    );
    expect(html).toContain('Guía 1');
    expect(html).toContain('100 puntos');
    expect(html).toContain('Volver');
    expect(html).toContain('Sin descripción');
    expect(html).not.toContain('Eliminar');
    expect(html).not.toContain('Editar actividad');
  });

  it('muestra el apartado Editar si hay callback', () => {
    const html = renderToStaticMarkup(
      createElement(LmsMisActividadVer, {
        fichaId: 1,
        actividad,
        onCerrar: () => undefined,
        onEditar: () => undefined,
      }),
    );
    expect(html).toContain('Editar actividad');
    expect(html).toContain('Volver');
  });
});
