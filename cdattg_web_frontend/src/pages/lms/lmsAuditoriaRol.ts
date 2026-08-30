/**
 * @module pages/lms/lmsAuditoriaRol
 * @description Quién puede entrar a la auditoría LMS.
 * @author Cristian Deysdayr Jiménez
 */

const ROL_SUPER_ADMIN = 'SUPER ADMINISTRADOR';

/**
 * Solo el superadministrador ve todos los módulos del aula.
 * @param {string[]} roles Roles del usuario.
 * @returns {boolean} Si es SUPER ADMINISTRADOR.
 */
export function lmsEsSuperAdmin(roles: string[]): boolean {
  return roles.includes(ROL_SUPER_ADMIN);
}

/**
 * Auditoría: solo el superadministrador.
 * @param {string[]} roles Roles de Casbin del usuario.
 * @returns {boolean} True si muestro el submódulo.
 */
export function lmsPuedeAuditar(roles: string[]): boolean {
  return lmsEsSuperAdmin(roles);
}
