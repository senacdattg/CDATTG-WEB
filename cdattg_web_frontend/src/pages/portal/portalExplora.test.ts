/**
 * @module pages/portal/portalExplora.test
 * @description Rutas públicas del área de investigación.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { EXPLORA_INVESTIGACION } from './portalExplora';

describe('EXPLORA_INVESTIGACION', () => {
  it('cubre los submódulos públicos', () => {
    const labels = EXPLORA_INVESTIGACION.map((e) => e.label);
    expect(labels).toContain('Presentación');
    expect(labels).toContain('Revista Rupícola');
    expect(EXPLORA_INVESTIGACION.every((e) => e.to.startsWith('/investigacion'))).toBe(true);
  });
});
