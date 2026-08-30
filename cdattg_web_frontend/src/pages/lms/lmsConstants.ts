/**
 * @module pages/lms/lmsConstants
 * @description Etiquetas y tipos de publicación del aula LMS.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsActividadTipo } from '../../types/lms';

export const LMS_TABS = {
  tablon: 'tablon',
  trabajos: 'trabajos',
  vencidas: 'vencidas',
  aprendices: 'aprendices',
  historial: 'historial',
  mis: 'mis',
  publicar: 'publicar',
} as const;

export type LmsTab = (typeof LMS_TABS)[keyof typeof LMS_TABS];

export const LMS_LABEL_HISTORIAL = 'Historial de actividades';

export const LMS_TIPO_OPTIONS: ReadonlyArray<{ value: LmsActividadTipo; label: string }> = [
  { value: 'TABLON', label: 'Publicación' },
  { value: 'GUIA', label: 'Guía' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'TRABAJO', label: 'Trabajo de clase' },
];

/**
 * Etiqueta visible de un tipo de actividad.
 * @param {string} tipo Código backend.
 */
export function labelTipoActividad(tipo: string): string {
  return LMS_TIPO_OPTIONS.find((o) => o.value === tipo)?.label ?? tipo;
}
