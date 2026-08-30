/**
 * @module pages/lms/LmsAulaMisActividades.test
 * @description Lista vacía o con Ver, Editar y Eliminar en la misma pestaña.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaMisActividades } from './LmsAulaMisActividades';
import type { LmsActividadItem } from '../../types/lms';

const item: LmsActividadItem = {
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

const props = {
  fichaId: 1,
  saving: false,
  onEditar: async () => undefined,
  onEliminar: async () => undefined,
};

describe('LmsAulaMisActividades', () => {
  it('avisa si no hay publicaciones', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaMisActividades, { ...props, actividades: [] }),
    );
    expect(html).toContain('Aún no ha publicado');
  });

  it('muestra Ver, Editar y Eliminar sin salir del aula', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaMisActividades, { ...props, actividades: [item] }),
    );
    expect(html).toContain('Guía 1');
    expect(html).toContain('Ver');
    expect(html).toContain('Editar');
    expect(html).toContain('Eliminar');
    expect(html).not.toContain('/lms/aulas/1/actividades/4');
  });

  it('abre editar si llega desde pendientes', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaMisActividades, {
        ...props,
        actividades: [item],
        panelInicial: { modo: 'editar', id: 4 },
      }),
    );
    expect(html).toContain('Editar actividad');
    expect(html).toContain('Cancelar');
    expect(html).not.toContain('Sí, eliminar');
  });

  it('en solo lectura oculta Editar y Eliminar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaMisActividades, { ...props, actividades: [item], soloLectura: true }),
    );
    expect(html).toContain('Ver');
    expect(html).not.toContain('Editar');
    expect(html).not.toContain('Eliminar');
  });
});
