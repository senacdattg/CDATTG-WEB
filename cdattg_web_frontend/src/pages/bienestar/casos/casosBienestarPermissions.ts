const ROLES_CASOS_BIENESTAR_OFICINA = ['SUPER ADMINISTRADOR', 'BIENESTAR AL APRENDIZ'] as const;
const ROLES_CASOS_BIENESTAR = [...ROLES_CASOS_BIENESTAR_OFICINA, 'INSTRUCTOR'] as const;

/** Dashboard global de asistencia (no incluye instructor líder). */
export function canViewAsistenciaDashboardGlobal(roles: string[]): boolean {
  return ROLES_CASOS_BIENESTAR_OFICINA.some((r) => roles.includes(r));
}

/** Casos de bienestar: oficina completa o instructor (alcance a fichas donde es líder). */
export function canViewCasosBienestar(roles: string[]): boolean {
  return ROLES_CASOS_BIENESTAR.some((r) => roles.includes(r));
}

export const MENSAJE_SIN_PERMISO_CASOS_BIENESTAR =
  'No tiene permiso para acceder a los casos de bienestar (requiere rol de Superadministrador, Bienestar al Aprendiz o ser instructor líder de ficha).';
