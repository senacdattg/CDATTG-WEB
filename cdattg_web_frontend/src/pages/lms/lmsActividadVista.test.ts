/**
 * @module pages/lms/lmsActividadVista.test
 * @description Solo lectura cuando no publica y no puede entregar.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsEntregaDeAprendiz, lmsMuestraEntregaAlumno } from './lmsActividadVista';

describe('lmsMuestraEntregaAlumno', () => {
  it('el aprendiz ve Mi trabajo', () => {
    expect(lmsMuestraEntregaAlumno(false, true)).toBe(true);
  });

  it('el instructor vigente no ve entrega de alumno', () => {
    expect(lmsMuestraEntregaAlumno(true, false)).toBe(false);
  });

  it('consulta solo mira, no entrega', () => {
    expect(lmsMuestraEntregaAlumno(false, false)).toBe(false);
  });
});

describe('lmsEntregaDeAprendiz', () => {
  it('encuentra la fila del aprendiz', () => {
    const fila = {
      id: 1,
      aprendiz_id: 8,
      aprendiz_nombre: 'ANA',
      documento: '1',
      entregado_en: '',
      tardia: false,
      calificacion: null,
      comentario_instructor: '',
      archivos: [],
    };
    expect(lmsEntregaDeAprendiz([fila], 8)?.aprendiz_id).toBe(8);
    expect(lmsEntregaDeAprendiz([fila], 9)).toBeUndefined();
  });
});
