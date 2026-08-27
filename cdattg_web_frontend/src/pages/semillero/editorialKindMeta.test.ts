/**
 * @module pages/semillero/editorialKindMeta.test
 * @description Metadatos de submódulos de investigación.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { EDITORIAL_ADMIN, editorialMeta } from './editorialKindMeta';

describe('editorialMeta', () => {
  it('resuelve revista', () => {
    expect(editorialMeta('revistas').titulo).toContain('Rupícola');
    expect(EDITORIAL_ADMIN.length).toBe(6);
  });
});
