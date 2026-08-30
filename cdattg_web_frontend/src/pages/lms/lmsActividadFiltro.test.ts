/**
 * @module pages/lms/lmsActividadFiltro.test
 * @description Pendientes, entregadas y vencidas según el rol.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { actividadEnPlazo, actividadesEntregadas, actividadesPendientes, actividadesVencidas } from './lmsActividadFiltro';
import type { LmsActividadItem } from '../../types/lms';

const now = new Date('2026-08-26T12:00:00');

function item(
  id: number,
  plazo: string | null,
  entregada = false,
  cantidad = 0,
): LmsActividadItem {
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
    entregada,
    cantidad_entregas: cantidad,
  };
}

describe('actividadEnPlazo', () => {
  it('acepta en plazo, por vencer y sin fecha; no vencidas', () => {
    expect(actividadEnPlazo(item(1, '2026-09-10T10:00:00'), now)).toBe(true);
    expect(actividadEnPlazo(item(2, '2026-08-27T10:00:00'), now)).toBe(true);
    expect(actividadEnPlazo(item(3, '2026-08-20T10:00:00'), now)).toBe(false);
    expect(actividadEnPlazo(item(4, null), now)).toBe(true);
  });
});

describe('actividadesPendientes', () => {
  it('el aprendiz no ve las ya entregadas ni las vencidas', () => {
    const list = actividadesPendientes(
      [item(1, '2026-09-10T10:00:00', false), item(2, null, true), item(3, '2026-08-20T10:00:00', false)],
      false,
      now,
    );
    expect(list.map((a) => a.id)).toEqual([1]);
  });

  it('el instructor ve las no vencidas, también sin fecha', () => {
    const list = actividadesPendientes(
      [item(1, '2026-09-10T10:00:00', true), item(2, '2026-08-20T10:00:00'), item(3, null)],
      true,
      now,
    );
    expect(list.map((a) => a.id)).toEqual([1, 3]);
  });
});

describe('actividadesEntregadas', () => {
  it('el aprendiz solo ve las que ya envió', () => {
    const list = actividadesEntregadas([item(1, null, false), item(2, null, true)], false);
    expect(list.map((a) => a.id)).toEqual([2]);
  });

  it('el instructor solo ve las que ya tienen envíos', () => {
    const list = actividadesEntregadas(
      [item(1, '2026-09-10T10:00:00', false, 0), item(2, null, false, 2)],
      true,
    );
    expect(list.map((a) => a.id)).toEqual([2]);
  });
});

describe('actividadesVencidas', () => {
  it('el aprendiz solo ve las que no envió y ya vencieron', () => {
    const list = actividadesVencidas(
      [item(1, '2026-08-20T10:00:00', false), item(2, '2026-08-20T10:00:00', true), item(3, '2026-09-10T10:00:00')],
      false,
      now,
    );
    expect(list.map((a) => a.id)).toEqual([1]);
  });

  it('el staff ve todas las vencidas', () => {
    const list = actividadesVencidas(
      [item(1, '2026-08-20T10:00:00', true), item(2, '2026-09-10T10:00:00')],
      true,
      now,
    );
    expect(list.map((a) => a.id)).toEqual([1]);
  });
});
