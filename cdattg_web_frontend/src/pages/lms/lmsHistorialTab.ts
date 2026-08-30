/**
 * @module pages/lms/lmsHistorialTab
 * @description Estado de ruta para abrir el historial y volver a él.
 * Lo pongo en el aula y en la entrega del aprendiz.
 * @author Cristian Deysdayr Jiménez
 */
import { LMS_TABS, type LmsTab } from './lmsConstants';
import { lmsPaths } from '../../routes/paths';

/** Abre la pestaña Historial de actividades al volver al aula. */
export function lmsAulaStateHistorial(): { tabAula: 'historial' } {
  return { tabAula: 'historial' };
}

/**
 * True si el aula debe abrir el historial.
 * @param {unknown} state location.state
 * @returns {boolean} Si viene del historial.
 */
export function lmsEsTabHistorial(state: unknown): boolean {
  if (!state || typeof state !== 'object') return false;
  return 'tabAula' in state && state.tabAula === 'historial';
}

/** Marca que la entrega se abrió desde el historial. */
export function lmsStateDesdeHistorial(): { fromHistorial: true } {
  return { fromHistorial: true };
}

/**
 * True si hay que volver al historial y no a aprendices.
 * @param {unknown} state location.state
 * @returns {boolean} Si el origen fue el historial.
 */
export function lmsVieneDelHistorial(state: unknown): boolean {
  if (!state || typeof state !== 'object') return false;
  return 'fromHistorial' in state && state.fromHistorial === true;
}

/**
 * Pestaña al entrar al aula: editar, historial o pendientes.
 * @param {unknown} panelInicial Panel de Mis actividades.
 * @param {boolean} tabHistorial Si el state pide historial.
 * @param {boolean} puedeVerHistorial Instructor o quien ve notas.
 * @returns {LmsTab} Pestaña inicial.
 */
export function lmsTabInicialAula(
  panelInicial: unknown,
  tabHistorial: boolean,
  puedeVerHistorial: boolean,
): LmsTab {
  if (panelInicial) return LMS_TABS.mis;
  if (tabHistorial && puedeVerHistorial) return LMS_TABS.historial;
  return LMS_TABS.tablon;
}

/**
 * A dónde vuelve Volver en la entrega.
 * @param {number} fichaId Aula.
 * @param {number} actividadId Actividad.
 * @param {unknown} state location.state
 */
export function lmsVolverDesdeEntrega(fichaId: number, actividadId: number, state: unknown) {
  if (lmsVieneDelHistorial(state)) {
    return { to: lmsPaths.aula(fichaId), state: lmsAulaStateHistorial() };
  }
  return { to: lmsPaths.actividadAprendices(fichaId, actividadId) };
}
