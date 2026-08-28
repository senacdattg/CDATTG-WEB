/**
 * @module pages/lms/LmsAulaAprendices.test
 * @description El aula reutiliza el listado de aprendices de ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LmsAulaAprendices } from './LmsAulaAprendices';
import type { LmsAulaAprendiz } from '../../types/lms';

function ap(id: number, nombre: string, extra: Partial<LmsAulaAprendiz> = {}): LmsAulaAprendiz {
  return { id, persona_id: id, nombre, documento: String(id), estado: true, oculto_en_asistencia: false, ...extra };
}

describe('LmsAulaAprendices', () => {
  it('muestra título, búsqueda y columnas del listado de ficha', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaAprendices, { fichaId: 1, aprendices: [ap(2, 'CARLOS JOSUE CAICEDO', { documento: '1089539076' })] }),
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

  it('con soloActivos oculta inactivos y ocultos en inasistencia', () => {
    const html = renderToStaticMarkup(
      createElement(LmsAulaAprendices, {
        fichaId: 1,
        soloActivos: true,
        aprendices: [
          ap(2, 'CARLOS JOSUE CAICEDO'),
          ap(3, 'ANA OCULTA', { oculto_en_asistencia: true }),
          ap(4, 'JUAN INACTIVO', { estado: false }),
        ],
      }),
    );
    expect(html).toContain('CARLOS JOSUE CAICEDO');
    expect(html).not.toContain('ANA OCULTA');
    expect(html).not.toContain('JUAN INACTIVO');
    expect(html).not.toContain('ocultos en asistencia');
  });
});
