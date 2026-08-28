/**
 * @module pages/lms/lmsMisPanel
 * @description Qué pantalla de Mis actividades está abierta (ver, editar o borrar).
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsActividadItem } from '../../types/lms';

export type LmsMisModo = 'ver' | 'editar' | 'borrar';

export type LmsMisPanel = Readonly<{ modo: LmsMisModo; id: number }>;

/**
 * Abre Editar de esa actividad.
 * @param {number} id Actividad.
 * @returns {LmsMisPanel} Panel de edición.
 */
export function lmsPanelEditar(id: number): LmsMisPanel {
  return { modo: 'editar', id };
}

/**
 * Estado de ruta para abrir Editar al volver al aula.
 * @param {number} id Actividad.
 * @returns {{ editarActividadId: number }} Estado de navegación.
 */
export function lmsAulaStateEditar(id: number): { editarActividadId: number } {
  return { editarActividadId: id };
}

/**
 * Estado de ruta para abrir la vista en pendientes.
 * @param {number} id Actividad.
 * @returns {{ verActividadId: number }} Estado de navegación.
 */
export function lmsAulaStateVer(id: number): { verActividadId: number } {
  return { verActividadId: id };
}

function idSiNumero(valor: unknown): number | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 1) return null;
  return valor;
}

/**
 * Si el instructor llega para editar, abre Mis actividades.
 * @param {unknown} state location.state
 * @returns {LmsMisPanel | null} Panel o nada.
 */
export function lmsMisPanelDesdeState(state: unknown): LmsMisPanel | null {
  if (!state || typeof state !== 'object') return null;
  if (!('editarActividadId' in state)) return null;
  const id = idSiNumero(state.editarActividadId);
  if (id) return lmsPanelEditar(id);
  return null;
}

/**
 * Si el instructor llega para leer, abre la vista en pendientes.
 * @param {unknown} state location.state
 * @returns {number | null} Id de la actividad o nada.
 */
export function lmsVerIdDesdeState(state: unknown): number | null {
  if (!state || typeof state !== 'object') return null;
  if (!('verActividadId' in state)) return null;
  return idSiNumero(state.verActividadId);
}

/**
 * La actividad del panel, o nada si ya no está en la lista.
 * @param {LmsActividadItem[]} list Publicaciones del aula.
 * @param {LmsMisPanel | null} panel Pantalla abierta.
 * @returns {LmsActividadItem | undefined} La actividad o nada.
 */
export function lmsActividadDePanel(
  list: LmsActividadItem[],
  panel: LmsMisPanel | null,
): LmsActividadItem | undefined {
  if (!panel) return undefined;
  return list.find((a) => a.id === panel.id);
}
