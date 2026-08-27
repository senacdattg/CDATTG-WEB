/**
 * @module pages/semillero/editorialFormState.test
 * @description Payload editorial sin id.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { editorialARequest, editorialVacio } from './editorialFormState';

describe('editorialARequest', () => {
  it('quita el id', () => {
    const body = editorialARequest({ ...editorialVacio, id: 9, titulo: 'N1' });
    expect(body).not.toHaveProperty('id');
    expect(body.titulo).toBe('N1');
  });
});
