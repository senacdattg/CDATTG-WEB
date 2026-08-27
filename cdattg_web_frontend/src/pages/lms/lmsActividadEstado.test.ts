/**
 * @module pages/lms/lmsActividadEstado.test
 * @description Estados de plazo y filtro de trabajos de clase.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { actividadesTrabajoClase, estadoPlazo, etiquetaEntregaAlumno, labelEstadoEntrega, labelEstadoPlazo } from './lmsActividadEstado';
import type { LmsActividadItem } from '../../types/lms';

const now = new Date('2026-08-26T12:00:00');

function item(id: number, plazo: string | null): LmsActividadItem {
  return {
    id,
    tipo: 'TABLON',
    titulo: `A${id}`,
    cuerpo: '',
    habilita_carga: Boolean(plazo),
    calificacion_max: null,
    plazo_entrega: plazo,
    creado_en: '',
    archivos: [],
  };
}

describe('estadoPlazo', () => {
  it('marca vencida, por vencer y sin plazo', () => {
    expect(estadoPlazo('2026-08-25T10:00:00', now)).toBe('vencida');
    expect(estadoPlazo('2026-08-28T10:00:00', now)).toBe('por_vencer');
    expect(estadoPlazo('2026-09-10T10:00:00', now)).toBe('en_plazo');
    expect(estadoPlazo(null, now)).toBe('sin_plazo');
  });

  it('etiqueta estados visibles', () => {
    expect(labelEstadoPlazo('vencida')).toBe('Vencida');
    expect(labelEstadoPlazo('sin_plazo')).toBe('');
  });
});

describe('etiquetaEntregaAlumno', () => {
  it('pide entregar o retraso según el plazo', () => {
    expect(etiquetaEntregaAlumno('2026-09-10T10:00:00', now)).toBe('Entregar');
    expect(etiquetaEntregaAlumno('2026-08-20T10:00:00', now)).toBe('Entregar con retraso');
  });
});

describe('labelEstadoEntrega', () => {
  it('describe envío, retraso o pendiente', () => {
    expect(labelEstadoEntrega(null, false)).toBe('No entregada');
    expect(labelEstadoEntrega('2026-08-21T10:00:00', false)).toBe('Entregada');
    expect(labelEstadoEntrega('2026-08-21T10:00:00', true)).toBe('Entregada con retraso');
  });
});

describe('actividadesTrabajoClase', () => {
  it('omite sin plazo y ordena vencidas primero', () => {
    const list = actividadesTrabajoClase(
      [item(1, '2026-09-10T10:00:00'), item(2, null), item(3, '2026-08-20T10:00:00')],
      now,
    );
    expect(list.map((a) => a.id)).toEqual([3, 1]);
  });
});
