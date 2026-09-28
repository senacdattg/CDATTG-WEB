/**
 * Pruebo el filtro de visitas para contar, ZIP y borrar.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { paramsBorrar } from './borrarAccesoParams';

describe('paramsBorrar', () => {
  it('deja solo page si no hay filtros', () => {
    expect(paramsBorrar('', '', '', '')).toEqual({ page: 1, page_size: 1 });
  });

  it('mete regional y sede en número', () => {
    expect(paramsBorrar('2', '9', '', '')).toMatchObject({ regional_id: 2, sede_id: 9 });
  });

  it('mete las fechas cuando hay rango', () => {
    expect(paramsBorrar('', '', '2026-01-01', '2026-01-02')).toMatchObject({
      fecha_desde: '2026-01-01',
      fecha_hasta: '2026-01-02',
    });
  });
});
