/**
 * @module pages/lms/lmsAuditoriaRol
 * @description Quién puede entrar a la auditoría LMS.
 * @author Cristian Deysdayr Jiménez
 */

const ROLES_AUDITORIA = new Set([
  'SUPER ADMINISTRADOR',
  'ADMINISTRADOR',
  'COORDINADOR',
  'INSTRUCTOR',
]);

/**
 * Auditoría: admin/coordinador o instructor. El aprendiz no entra.
 * @param {string[]} roles Roles de Casbin del usuario.
 * @returns {boolean} True si muestro el submódulo.
 */
export function lmsPuedeAuditar(roles: string[]): boolean {
  return roles.some((r) => ROLES_AUDITORIA.has(r));
}
