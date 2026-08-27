/**
 * @module pages/lms/LmsActividadCard.test
 * @description La tarjeta muestra título, descripción, plazo e instructor.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsActividadCard } from './LmsActividadCard';
import type { LmsActividadItem } from '../../types/lms';

const actividad: LmsActividadItem = {
  id: 4,
  tipo: 'TABLON',
  titulo: 'T_200_EV07',
  cuerpo: 'Elaborar el derecho de petición',
  habilita_carga: true,
  calificacion_max: 100,
  plazo_entrega: '2025-08-11T23:00:00',
  creado_en: '',
  instructor_nombre: 'VICTOR MANUEL TELLEZ',
  archivos: [],
};

describe('LmsActividadCard', () => {
  it('enlaza a la actividad con título, cuerpo, plazo e instructor', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(LmsActividadCard, { fichaId: 12, actividad })),
    );
    expect(html).toContain('T_200_EV07');
    expect(html).toContain('Elaborar el derecho de petición');
    expect(html).toContain('Instructor: VICTOR MANUEL TELLEZ');
    expect(html).toContain('/lms/aulas/12/actividades/4');
  });
});
