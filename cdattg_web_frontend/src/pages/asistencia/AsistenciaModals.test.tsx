import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AsistenciaModals } from './AsistenciaModals';
import type { AsistenciaModalsModel } from './asistenciaModalsTypes';

function basePage(overrides: Partial<AsistenciaModalsModel> = {}): AsistenciaModalsModel {
  return {
    observacionesModal: null,
    setObservacionesModal: vi.fn(),
    tiposObservacionCatalog: [{ id: 1, codigo: 'RETARDO', nombre: 'Retardo' }],
    observacionesGuardando: false,
    handleGuardarObservaciones: vi.fn(async () => undefined),
    observacionesSesionModal: null,
    setObservacionesSesionModal: vi.fn(),
    observacionesSesionGuardando: false,
    handleGuardarObservacionesSesion: vi.fn(async () => undefined),
    estadoModal: null,
    setEstadoModal: vi.fn(),
    estadoGuardando: false,
    handleGuardarEstado: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('AsistenciaModals', () => {
  it('no renderiza diálogos si todo es null', () => {
    const html = renderToStaticMarkup(createElement(AsistenciaModals, { page: basePage() }));
    expect(html).toBe('');
  });

  it('renderiza modal de observaciones', () => {
    const html = renderToStaticMarkup(
      createElement(AsistenciaModals, {
        page: basePage({
          observacionesModal: {
            asistenciaId: 1,
            aprendizId: 2,
            nombre: 'Ana',
            observaciones: 'nota',
            tipoObservacionIds: [],
          },
        }),
      }),
    );
    expect(html).toContain('Observaciones — Ana');
    expect(html).toContain('Guardar');
  });

  it('renderiza modal de sesión y estado', () => {
    const sesion = renderToStaticMarkup(
      createElement(AsistenciaModals, {
        page: basePage({ observacionesSesionModal: { observaciones: 'obs sesión' } }),
      }),
    );
    expect(sesion).toContain('Observación de la sesión');

    const estado = renderToStaticMarkup(
      createElement(AsistenciaModals, {
        page: basePage({
          estadoModal: {
            asistenciaAprendizId: 3,
            nombre: 'Luis',
            estado: 'ASISTENCIA_COMPLETA',
            motivo: '',
          },
          estadoGuardando: true,
        }),
      }),
    );
    expect(estado).toContain('Estado — Luis');
    expect(estado).toContain('Guardar estado');
  });
});
