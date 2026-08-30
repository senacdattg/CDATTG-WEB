/**
 * @module pages/lms/LmsAulaHistorial.test
 * @description Carga, error, vacío y tabla con notas.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const fila = {
  aprendiz_id: 2,
  aprendiz_nombre: 'ANA LOPEZ',
  actividad_id: 4,
  titulo: 'Guía 1',
  calificacion: 85,
  calificacion_max: 100,
};

const estado = { filas: [fila], loading: false, error: '' };

vi.mock('./useLmsHistorial', () => ({
  useLmsHistorial: () => estado,
}));

import { LmsAulaHistorial } from './LmsAulaHistorial';

describe('LmsAulaHistorial', () => {
  it('pinta nombre, título y nota', () => {
    estado.filas = [fila];
    estado.loading = false;
    estado.error = '';
    const html = renderToStaticMarkup(createElement(LmsAulaHistorial, { fichaId: 1 }));
    expect(html).toContain('ANA LOPEZ');
    expect(html).toContain('Guía 1');
    expect(html).toContain('85 / 100');
  });

  it('avisa si no hay filas', () => {
    estado.filas = [];
    const html = renderToStaticMarkup(createElement(LmsAulaHistorial, { fichaId: 1 }));
    expect(html).toContain('Aún no hay aprendices o actividades');
  });

  it('muestra el error de carga', () => {
    estado.error = 'No se pudo cargar el historial';
    const html = renderToStaticMarkup(createElement(LmsAulaHistorial, { fichaId: 1 }));
    expect(html).toContain('No se pudo cargar el historial');
  });
});
