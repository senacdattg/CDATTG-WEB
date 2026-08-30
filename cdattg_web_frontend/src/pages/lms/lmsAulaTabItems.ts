/**
 * @module pages/lms/lmsAulaTabItems
 * @description Qué pestañas ve el aprendiz y el instructor.
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
 * El aprendiz ve pendientes, entregadas y vencidas. El instructor sigue con el orden anterior.
 * @param {boolean} puedePublicar Instructor de la ficha.
 * @param {boolean} puedeVerHistorial Instructor o superadministrador.
 * @returns {LmsAulaTabItem[]} Pestañas en orden.
 */
export function lmsAulaTabItems(puedePublicar: boolean, puedeVerHistorial: boolean): LmsAulaTabItem[] {
  if (puedePublicar) {
    const extra = [TAB_MIS, TAB_PUBLICAR];
    if (puedeVerHistorial) extra.push(TAB_HISTORIAL);
    return [
      { id: LMS_TABS.tablon, label: 'Actividades pendientes' },
      { id: LMS_TABS.trabajos, label: 'Actividades entregadas' },
      TAB_APRENDICES,
      ...extra,
    ];
  }
  if (puedeVerHistorial) return [...TABS_APRENDIZ, TAB_HISTORIAL];
  return TABS_APRENDIZ;
}
