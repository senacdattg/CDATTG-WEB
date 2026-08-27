/**
 * @module pages/lms/lmsAprendizToResponse.test
 * @description Mapeo de aprendiz LMS al listado de ficha.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { lmsAprendizToResponse } from './lmsAprendizToResponse';

describe('lmsAprendizToResponse', () => {
  it('copia nombre, documento y estado', () => {
    const r = lmsAprendizToResponse(
      {
        id: 3,
        persona_id: 9,
        nombre: 'ANA RUIZ',
        documento: '123',
        estado: true,
        oculto_en_asistencia: false,
      },
      15,
    );
    expect(r.persona_nombre).toBe('ANA RUIZ');
    expect(r.persona_documento).toBe('123');
    expect(r.ficha_caracterizacion_id).toBe(15);
    expect(r.estado).toBe(true);
  });
});
