/**
 * @module pages/semillero/editorialKindMeta
 * @description Metadatos de submódulos editoriales en el admin.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import type { EditorialKind } from '../../types/biogjgas';
import { semilleroAdminPaths } from '../../routes/paths';

export type EditorialMeta = { kind: EditorialKind; titulo: string; path: string };

export const EDITORIAL_ADMIN: EditorialMeta[] = [
  { kind: 'banners', titulo: 'Banners del portal', path: semilleroAdminPaths.banners },
  { kind: 'revistas', titulo: 'Revista Rupícola', path: semilleroAdminPaths.revista },
  { kind: 'boletines', titulo: 'Boletines', path: semilleroAdminPaths.boletines },
  { kind: 'podcasts', titulo: 'Podcast', path: semilleroAdminPaths.podcast },
  { kind: 'convocatorias', titulo: 'Convocatorias', path: semilleroAdminPaths.convocatorias },
  { kind: 'actividades', titulo: 'Actividades', path: semilleroAdminPaths.actividades },
];

/**
 * Busca metadatos por kind.
 */
export function editorialMeta(kind: EditorialKind): EditorialMeta {
  const found = EDITORIAL_ADMIN.find((e) => e.kind === kind);
  if (!found) {
    throw new Error('submódulo desconocido');
  }
  return found;
}
