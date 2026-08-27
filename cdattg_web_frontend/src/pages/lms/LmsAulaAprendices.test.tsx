/**
 * @module pages/lms/LmsAulaAprendices.test
 * @description El aula reutiliza el listado de aprendices de ficha.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaAprendices } from './LmsAulaAprendices';

describe('LmsAulaAprendices', () => {
  it('muestra título, búsqueda y columnas del listado de ficha', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaAprendices, {
        fichaId: 1,
        aprendices: [
          {
            id: 2,
            persona_id: 9,
            nombre: 'CARLOS JOSUE CAICEDO',
            documento: '1089539076',
            estado: true,
            oculto_en_asistencia: false,
          },
        ],
      }),
    );
    expect(html).toContain('Aprendices asignados');
    expect(html).toContain('Buscar por nombre o documento');
    expect(html).toContain('Aprendiz');
    expect(html).toContain('Documento');
    expect(html).toContain('Estado');
    expect(html).toContain('CARLOS JOSUE CAICEDO');
    expect(html).toContain('1089539076');
    expect(html).toContain('Activo');
    expect(html).not.toContain('Asignar aprendices');
  });
});
