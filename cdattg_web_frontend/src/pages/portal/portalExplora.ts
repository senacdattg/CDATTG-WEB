/**
 * @module pages/portal/portalExplora
 * @description Enlaces del bloque «Explora el área de investigación».
 * @author Cristian Deysdayr Jiménez
 */
import { portalPaths } from '../../routes/paths';

export const EXPLORA_INVESTIGACION = [
  { to: portalPaths.presentacion, label: 'Presentación' },
  { to: portalPaths.revista, label: 'Revista Rupícola' },
  { to: portalPaths.boletines, label: 'Boletines' },
  { to: portalPaths.podcast, label: 'Podcast' },
  { to: portalPaths.convocatorias, label: 'Convocatorias' },
  { to: portalPaths.actividades, label: 'Actividades' },
] as const;
