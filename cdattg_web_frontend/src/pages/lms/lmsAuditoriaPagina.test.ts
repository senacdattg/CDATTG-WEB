/**
 * @module pages/lms/lmsAuditoriaPagina.test
 * @description El listado de carpetas va de 20 en 20.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { LMS_AUDITORIA_PAGE_SIZE, lmsTotalPaginas } from './lmsAuditoriaPagina';

describe('lmsTotalPaginas', () => {
  it('con 20 o menos cabe en una página', () => {
    expect(LMS_AUDITORIA_PAGE_SIZE).toBe(20);
    expect(lmsTotalPaginas(0)).toBe(1);
    expect(lmsTotalPaginas(20)).toBe(1);
  });

  it('con 21 abre la segunda página', () => {
    expect(lmsTotalPaginas(21)).toBe(2);
    expect(lmsTotalPaginas(40)).toBe(2);
  });
});
