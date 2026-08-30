/**
 * @module pages/lms/lmsAuditoriaRol.test
 * @description Quién entra a auditoría LMS.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { lmsEsSuperAdmin, lmsPuedeAuditar } from './lmsAuditoriaRol';

describe('lmsPuedeAuditar', () => {
  it('solo deja entrar al superadministrador', () => {
    expect(lmsPuedeAuditar(['SUPER ADMINISTRADOR'])).toBe(true);
    expect(lmsPuedeAuditar(['ADMINISTRADOR'])).toBe(false);
    expect(lmsPuedeAuditar(['COORDINADOR'])).toBe(false);
    expect(lmsPuedeAuditar(['INSTRUCTOR'])).toBe(false);
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
