/**
 * @module pages/lms/lmsToast.test
 * @description Overlay y toast al entregar, publicar, actualizar o eliminar.
 * @author Cristian Deysdayr Jiménez
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  encenderAvisoEntrega,
  mostrarToastActividadActualizada,
  mostrarToastActividadEliminada,
  mostrarToastActividadPublicada,
  mostrarToastEntregaDeshecha,
  mostrarToastEntregaExitosa,
} from './lmsToast';

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn(() => Promise.resolve()) },
}));

describe('lmsToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('enciende el aviso de deshacer y lo apaga', () => {
    vi.useFakeTimers();
    const setAviso = vi.fn();
    encenderAvisoEntrega('deshacer', setAviso);
    expect(setAviso).toHaveBeenCalledWith('deshacer');
    vi.advanceTimersByTime(1800);
    expect(setAviso).toHaveBeenCalledWith(null);
  });

  it('enciende el aviso de entrega', () => {
    vi.useFakeTimers();
    const setAviso = vi.fn();
    encenderAvisoEntrega('exito', setAviso);
    expect(setAviso).toHaveBeenCalledWith('exito');
  });

  it('enciende el aviso de actividad publicada', () => {
    vi.useFakeTimers();
    const setAviso = vi.fn();
    encenderAvisoEntrega('publicada', setAviso);
    expect(setAviso).toHaveBeenCalledWith('publicada');
  });

  it('enciende el aviso de actividad actualizada', () => {
    vi.useFakeTimers();
    const setAviso = vi.fn();
    encenderAvisoEntrega('actualizada', setAviso);
    expect(setAviso).toHaveBeenCalledWith('actualizada');
  });

  it('enciende el aviso de actividad eliminada', () => {
    vi.useFakeTimers();
    const setAviso = vi.fn();
    encenderAvisoEntrega('eliminada', setAviso);
    expect(setAviso).toHaveBeenCalledWith('eliminada');
  });

  it('dispara los toasts sin lanzar', () => {
    expect(() => mostrarToastEntregaExitosa()).not.toThrow();
    expect(() => mostrarToastEntregaDeshecha()).not.toThrow();
    expect(() => mostrarToastActividadPublicada()).not.toThrow();
    expect(() => mostrarToastActividadActualizada()).not.toThrow();
    expect(() => mostrarToastActividadEliminada()).not.toThrow();
  });
});
