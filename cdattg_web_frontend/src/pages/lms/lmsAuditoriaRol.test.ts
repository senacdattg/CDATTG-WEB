/**
 * @module pages/lms/lmsAuditoriaRol.test
 * @description Quién entra a auditoría LMS.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsEsSuperAdmin, lmsPuedeAuditar } from './lmsAuditoriaRol';

describe('lmsPuedeAuditar', () => {
  it('deja entrar a admin e instructor', () => {
    expect(lmsPuedeAuditar(['ADMINISTRADOR'])).toBe(true);
    expect(lmsPuedeAuditar(['INSTRUCTOR'])).toBe(true);
  });

  it('reconoce solo al superadministrador', () => {
    expect(lmsEsSuperAdmin(['SUPER ADMINISTRADOR'])).toBe(true);
    expect(lmsEsSuperAdmin(['ADMINISTRADOR'])).toBe(false);
  });

  it('bloquea al aprendiz', () => {
    expect(lmsPuedeAuditar(['APRENDIZ'])).toBe(false);
    expect(lmsPuedeAuditar([])).toBe(false);
  });
});
