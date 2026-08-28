/**
 * @module pages/lms/LmsAulaCuerpo.test
 * @description El aula avisa cuando el aprendiz solo puede consultar.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaCuerpo } from './LmsAulaCuerpo';
import type { useLmsAula } from './useLmsAula';
import type { LmsAulaDetalle, LmsActividadItem } from '../../types/lms';

const page = {
  aula: null,
  loading: false,
  error: '',
  saving: false,
  recargar: async () => undefined,
  publicar: async () => undefined,
  editar: async () => undefined,
  eliminar: async () => undefined,
} as ReturnType<typeof useLmsAula>;

const aula: LmsAulaDetalle = {
  ficha_id: 1,
  numero_ficha: '2900001',
  nombre_programa: 'ADSO',
  tipo_formacion: 'COMPLEMENTARIA',
  puede_publicar: false,
  puede_entregar: true,
  aprendices: [],
  actividades: [],
};

const act: LmsActividadItem = {
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

describe('LmsAulaCuerpo', () => {
  it('muestra aviso de solo consulta si no puede entregar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaCuerpo, { aula: { ...aula, puede_entregar: false }, page }),
    );
    expect(html).toContain('Solo consulta');
    expect(html).toContain('No puede subir archivos');
  });

  it('no avisa si el aprendiz sí puede entregar', () => {
    const html = renderToStaticMarkup(createElement(LmsAulaCuerpo, { aula, page }));
    expect(html).not.toContain('Solo consulta');
  });

  it('el instructor no ve el aviso', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaCuerpo, { aula: { ...aula, puede_publicar: true, puede_entregar: false }, page }),
    );
    expect(html).not.toContain('Solo consulta');
  });

  it('abre editar en Mis actividades si llega con panel de edición', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaCuerpo, {
        aula: { ...aula, puede_publicar: true, actividades: [act] },
        page,
        panelInicial: { modo: 'editar', id: 4 },
      }),
    );
    expect(html).toContain('Editar actividad');
    expect(html).toContain('Guía 1');
    expect(html).toContain('Guardar cambios');
  });

  it('en pendientes muestra la vista y el apartado Editar', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaCuerpo, {
        aula: { ...aula, puede_publicar: true, actividades: [act] },
        page,
        verInicial: 4,
      }),
    );
    expect(html).toContain('Editar actividad');
    expect(html).toContain('Volver');
    expect(html).not.toContain('Guardar cambios');
  });
});
