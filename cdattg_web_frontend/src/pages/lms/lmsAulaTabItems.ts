/**
 * @module pages/lms/lmsAulaTabItems
 * @description Qué pestañas ve cada rol en el aula.
 * Lo hice para que el aprendiz vea pendientes, entregadas y vencidas.
 * Lo usa LmsAulaTabs.
 * @author Cristian Deysdayr Jiménez
 */
import { LMS_LABEL_HISTORIAL, LMS_TABS, type LmsTab } from './lmsConstants';

export type LmsAulaTabItem = Readonly<{ id: LmsTab; label: string }>;

const TAB_APRENDICES: LmsAulaTabItem = { id: LMS_TABS.aprendices, label: 'Aprendices' };
const TAB_MIS: LmsAulaTabItem = { id: LMS_TABS.mis, label: 'Mis actividades' };
const TAB_PUBLICAR: LmsAulaTabItem = { id: LMS_TABS.publicar, label: 'Publicar actividad' };
const TAB_HISTORIAL: LmsAulaTabItem = { id: LMS_TABS.historial, label: LMS_LABEL_HISTORIAL };
const TABS_APRENDIZ: LmsAulaTabItem[] = [
  { id: LMS_TABS.tablon, label: 'Actividades pendientes' },
  { id: LMS_TABS.trabajos, label: 'Actividades entregadas' },
  { id: LMS_TABS.vencidas, label: 'Actividades vencidas' },
  TAB_APRENDICES,
];

/**
 * El superadministrador ve cada módulo. El instructor: los suyos. El aprendiz: pendientes.
 * @param {boolean} puedePublicar Instructor de la ficha.
 * @param {boolean} puedeVerHistorial Instructor o superadministrador.
 * @param {boolean} [esSuperAdmin] Ve todos los módulos; solo actúa si publica.
 * @returns {LmsAulaTabItem[]} Pestañas en orden.
 */
export function lmsAulaTabItems(
  puedePublicar: boolean,
  puedeVerHistorial: boolean,
  esSuperAdmin = false,
): LmsAulaTabItem[] {
  if (esSuperAdmin) {
    return [...TABS_APRENDIZ, TAB_MIS, TAB_PUBLICAR, TAB_HISTORIAL];
  }
  if (puedePublicar) {
    return [TAB_APRENDICES, TAB_MIS, TAB_PUBLICAR, TAB_HISTORIAL];
  }
  if (puedeVerHistorial) return [...TABS_APRENDIZ, TAB_HISTORIAL];
  return TABS_APRENDIZ;
}
