import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  AprendicesFichaStep,
  BusquedaFichasStep,
  FichaExplorarExtra,
  HistorialIngresoSalida,
  filtroInicialAprendiz,
  formatFechaLarga,
  panelStepContent,
  toFichaCard,
} from './RegistrosAprendizPanel';

const fichaBase = {
  ficha_id: 1,
  ficha_numero: '3173334',
  programa_nombre: 'ADSO',
  sede_nombre: 'Sede',
  jornada_nombre: 'Mañana',
  instructor_nombre: 'Inst',
  ambiente_nombre: 'A1',
  modalidad_nombre: 'Presencial',
  cantidad_aprendices: 20,
  coincidencias_aprendiz: 2,
  status: true,
};

const aprendiz = {
  aprendiz_id: 9,
  nombre_completo: 'Ana Pérez',
  numero_documento: '123',
  total_registros: 2,
};

describe('helpers RegistrosAprendizPanel', () => {
  it('toFichaCard y filtroInicialAprendiz', () => {
    const card = toFichaCard(fichaBase);
    expect(card.id).toBe(1);
    expect(card.ficha).toBe('3173334');
    expect(filtroInicialAprendiz(fichaBase, 'ana')).toBe('ana');
    expect(filtroInicialAprendiz({ ...fichaBase, coincidencias_aprendiz: 0 }, 'ana')).toBeUndefined();
  });

  it('formatFechaLarga', () => {
    expect(formatFechaLarga('mala')).toBe('mala');
    expect(formatFechaLarga('2026-06-21').toLowerCase()).toContain('2026');
  });
});

describe('pasos UI RegistrosAprendizPanel', () => {
  it('BusquedaFichasStep con fichas, error y quitar', () => {
    const html = renderToStaticMarkup(
      createElement(BusquedaFichasStep, {
        query: '317',
        queryAplicada: '317',
        loading: false,
        error: 'Sin coincidencias',
        fichas: [fichaBase],
        onQueryChange: vi.fn(),
        onExplorar: vi.fn(),
        onLimpiar: vi.fn(),
        onAbrirFicha: vi.fn(),
      }),
    );
    expect(html).toContain('Sin coincidencias');
    expect(html).toContain('Quitar');
    expect(html).toContain('Ver aprendices');
    expect(html).toContain('coincidencia');
  });

  it('BusquedaFichasStep loading sin quitar', () => {
    const html = renderToStaticMarkup(
      createElement(BusquedaFichasStep, {
        query: '',
        queryAplicada: '',
        loading: true,
        error: '',
        fichas: [],
        onQueryChange: vi.fn(),
        onExplorar: vi.fn(),
        onLimpiar: vi.fn(),
        onAbrirFicha: vi.fn(),
      }),
    );
    expect(html).toContain('Buscando');
    expect(html).not.toContain('Quitar');
  });

  it('AprendicesFichaStep con y sin filas', () => {
    const con = renderToStaticMarkup(
      createElement(AprendicesFichaStep, {
        ficha: fichaBase,
        filtroAprendiz: '',
        loading: false,
        error: 'err',
        aprendices: [aprendiz],
        onFiltroChange: vi.fn(),
        onFiltrar: vi.fn(),
        onVolver: vi.fn(),
        onVerRegistros: vi.fn(),
      }),
    );
    expect(con).toContain('Ana Pérez');
    expect(con).toContain('Ver ingresos/salidas');
    expect(con).toContain('err');

    const vacio = renderToStaticMarkup(
      createElement(AprendicesFichaStep, {
        ficha: fichaBase,
        filtroAprendiz: 'x',
        loading: false,
        error: '',
        aprendices: [],
        onFiltroChange: vi.fn(),
        onFiltrar: vi.fn(),
        onVolver: vi.fn(),
        onVerRegistros: vi.fn(),
      }),
    );
    expect(vacio).toContain('No hay aprendices');
  });

  it('HistorialIngresoSalida estados', () => {
    const regs = [
      { asistencia_id: 1, fecha: '2026-06-21', hora_ingreso: '08:00', hora_salida: '12:00' },
      { asistencia_id: 2, fecha: '2026-06-20', hora_ingreso: '07:00', hora_salida: null },
    ];
    const con = renderToStaticMarkup(
      createElement(HistorialIngresoSalida, {
        aprendiz,
        fichaNumero: '3173334',
        registros: regs,
        loading: false,
        error: '',
        onVolver: vi.fn(),
      }),
    );
    expect(con).toContain('Seleccione el día');
    expect(con).toContain('Tomas del');
    expect(con).toContain('2026-06-21');

    const vacio = renderToStaticMarkup(
      createElement(HistorialIngresoSalida, {
        aprendiz,
        fichaNumero: '3173334',
        registros: [],
        loading: false,
        error: 'falló',
        onVolver: vi.fn(),
      }),
    );
    expect(vacio).toContain('Sin registros');
    expect(vacio).toContain('falló');
  });

  it('FichaExplorarExtra y panelStepContent ramas', () => {
    expect(renderToStaticMarkup(createElement(FichaExplorarExtra, { ficha: fichaBase, queryAplicada: 'q' }))).toContain(
      'coincidencia',
    );
    expect(
      renderToStaticMarkup(
        createElement(FichaExplorarExtra, {
          ficha: { ...fichaBase, coincidencias_aprendiz: 0 },
          queryAplicada: 'q',
        }),
      ),
    ).toBe('');

    const busqueda = panelStepContent({
      fichaSel: null,
      aprendizSel: null,
      listaRegistros: [],
      loading: false,
      error: '',
      query: '',
      queryAplicada: '',
      fichas: [],
      filtroAprendiz: '',
      aprendices: [],
      onQueryChange: vi.fn(),
      onExplorar: vi.fn(),
      onLimpiar: vi.fn(),
      onAbrirFicha: vi.fn(),
      onFiltroChange: vi.fn(),
      onFiltrar: vi.fn(),
      onVolverFichas: vi.fn(),
      onVerRegistros: vi.fn(),
      onVolverAprendices: vi.fn(),
    });
    expect(renderToStaticMarkup(busqueda)).toContain('Buscar ficha');

    const lista = panelStepContent({
      fichaSel: fichaBase,
      aprendizSel: null,
      listaRegistros: [],
      loading: false,
      error: '',
      query: '',
      queryAplicada: '',
      fichas: [],
      filtroAprendiz: '',
      aprendices: [aprendiz],
      onQueryChange: vi.fn(),
      onExplorar: vi.fn(),
      onLimpiar: vi.fn(),
      onAbrirFicha: vi.fn(),
      onFiltroChange: vi.fn(),
      onFiltrar: vi.fn(),
      onVolverFichas: vi.fn(),
      onVerRegistros: vi.fn(),
      onVolverAprendices: vi.fn(),
    });
    expect(renderToStaticMarkup(lista)).toContain('Volver a fichas');

    const hist = panelStepContent({
      fichaSel: fichaBase,
      aprendizSel: aprendiz,
      listaRegistros: [{ asistencia_id: 1, fecha: '2026-06-21', hora_ingreso: '08:00', hora_salida: '10:00' }],
      loading: false,
      error: '',
      query: '',
      queryAplicada: '',
      fichas: [],
      filtroAprendiz: '',
      aprendices: [],
      onQueryChange: vi.fn(),
      onExplorar: vi.fn(),
      onLimpiar: vi.fn(),
      onAbrirFicha: vi.fn(),
      onFiltroChange: vi.fn(),
      onFiltrar: vi.fn(),
      onVolverFichas: vi.fn(),
      onVerRegistros: vi.fn(),
      onVolverAprendices: vi.fn(),
    });
    expect(renderToStaticMarkup(hist)).toContain('Volver a aprendices');
  });
});
