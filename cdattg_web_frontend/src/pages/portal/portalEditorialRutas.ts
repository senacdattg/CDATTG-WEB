/**
 * @module pages/portal/portalEditorialRutas
 * @description Kind público y rutas de detalle editorial.
 * @author Cristian Deysdayr Jiménez
 */
import type { EditorialKind } from '../../types/biogjgas';
import { portalPaths } from '../../routes/paths';

export type EditorialPublico = {
  kind: EditorialKind;
  titulo: string;
  detalle: (id: string) => string;
};

/** Configuración de listados públicos (sin banners). */
export const EDITORIAL_PUBLICO: Record<string, EditorialPublico> = {
  revista: { kind: 'revistas', titulo: 'Revista Rupícola', detalle: (id) => portalPaths.revistaDetalle(id) },
  boletines: { kind: 'boletines', titulo: 'Boletines', detalle: (id) => portalPaths.boletin(id) },
  podcast: { kind: 'podcasts', titulo: 'Podcast', detalle: (id) => portalPaths.podcastDetalle(id) },
  convocatorias: { kind: 'convocatorias', titulo: 'Convocatorias', detalle: (id) => portalPaths.convocatoria(id) },
  actividades: { kind: 'actividades', titulo: 'Actividades', detalle: (id) => portalPaths.actividad(id) },
};
