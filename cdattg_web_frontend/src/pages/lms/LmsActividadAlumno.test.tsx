/**
 * @module pages/lms/LmsActividadAlumno.test
 * @description Vista de entrega del aprendiz: adjuntar y deshacer.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsActividadAlumno } from './LmsActividadAlumno';
import type { LmsActividadDetalle } from '../../types/lms';

const detalle: LmsActividadDetalle = {
  id: 4,
  tipo: 'TABLON',
  titulo: 'Guía',
  cuerpo: 'Instrucciones',
  habilita_carga: true,
  calificacion_max: 100,
  plazo_entrega: '2026-09-10T23:00:00',
  creado_en: '',
  instructor_nombre: 'ANA',
  archivos: [],
  puede_publicar: false,
  mi_entrega: null,
  entregas: [],
};

describe('LmsActividadAlumno', () => {
  it('muestra Mi trabajo y Adjuntar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsActividadAlumno, {
        fichaId: 1,
        detalle,
        saving: false,
        onEntregar: async () => undefined,
        onDeshacer: async () => undefined,
      }),
    );
    expect(html).toContain('Mi trabajo');
    expect(html).toContain('Adjuntar PDF');
    expect(html).toContain('Entregar');
    expect(html).toContain('Solo PDF');
    expect(html).toContain('application/pdf');
  });

  it('muestra Deshacer entrega cuando ya envió', () => {
    const html = renderToStaticMarkup(
      createElement(LmsActividadAlumno, {
        fichaId: 1,
        detalle: {
          ...detalle,
          mi_entrega: {
            id: 8,
            aprendiz_id: 2,
            aprendiz_nombre: 'CARLOS',
            documento: '1',
            entregado_en: '2026-08-20T10:00:00',
            tardia: false,
            calificacion: null,
            comentario_instructor: '',
            archivos: [{ id: 1, nombre: 'ev.pdf', tamano: 4 }],
          },
        },
        saving: false,
        onEntregar: async () => undefined,
        onDeshacer: async () => undefined,
      }),
    );
    expect(html).toContain('Deshacer entrega');
    expect(html).toContain('ev.pdf');
    expect(html).not.toContain('Adjuntar PDF');
  });

  it('en consulta oculta adjuntar y deshacer', () => {
    const html = renderToStaticMarkup(
      createElement(LmsActividadAlumno, {
        fichaId: 1,
        detalle: {
          ...detalle,
          puede_entregar: false,
          mi_entrega: {
            id: 8,
            aprendiz_id: 2,
            aprendiz_nombre: 'CARLOS',
            documento: '1',
            entregado_en: '2026-08-20T10:00:00',
            tardia: false,
            calificacion: null,
            comentario_instructor: '',
            archivos: [{ id: 1, nombre: 'ev.pdf', tamano: 4 }],
          },
        },
        saving: false,
        onEntregar: async () => undefined,
        onDeshacer: async () => undefined,
      }),
    );
    expect(html).toContain('Solo consulta');
    expect(html).toContain('ev.pdf');
    expect(html).not.toContain('Adjuntar PDF');
    expect(html).not.toContain('Deshacer entrega');
  });
});
