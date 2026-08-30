/**
 * @module pages/lms/lmsAulaCuerpoVista
 * @description Qué aviso y qué panel abre el aula.
 * Lo saqué de LmsAulaCuerpo para no pasar de 15 de complejidad.
 * Lo usa LmsAulaCuerpo y LmsAulaCuerpoPaneles.
 * @author Cristian Deysdayr Jiménez
 */
import { LMS_TABS, type LmsTab } from './lmsConstants';

/**
 * El aprendiz inactivo ve el aviso de solo consulta.
 * @param {boolean} veNotas Si ve notas o historial.
 * @param {boolean | undefined} puedeEntregar Si puede subir archivos.
 * @returns {boolean} Si muestro el aviso ámbar.
 */
export function lmsAvisoAprendizConsulta(veNotas: boolean, puedeEntregar?: boolean): boolean {
  return veNotas === false && puedeEntregar === false;
}

/**
 * El superadmin no asignado ve el aviso de solo consulta.
 * @param {boolean} esSuper Si es superadministrador.
 * @param {boolean} puedePublicar Si está asignado como instructor.
 * @returns {boolean} Si muestro el aviso ámbar.
 */
export function lmsAvisoSuperConsulta(esSuper: boolean, puedePublicar: boolean): boolean {
  return esSuper && puedePublicar === false;
}

/**
 * En pendientes el instructor no abre la vista; el aprendiz sí.
 * @param {boolean} puedePublicar Instructor de la ficha.
 * @param {number | null | undefined} verInicial Id pedido por la ruta.
 * @returns {number | null} Id o nada.
 */
export function lmsVerInicialTablon(puedePublicar: boolean, verInicial?: number | null): number | null {
  if (puedePublicar) return null;
  return verInicial ?? null;
}

/**
 * Vencidas solo si es esa pestaña y no publica.
 * @param {LmsTab} tab Pestaña activa.
 * @param {boolean} puedePublicar Instructor de la ficha.
 * @returns {boolean} Si pinto Actividades vencidas.
 */
export function lmsMuestraVencidas(tab: LmsTab, puedePublicar: boolean): boolean {
  return tab === LMS_TABS.vencidas && puedePublicar === false;
}

/**
 * Historial, Mis o Publicar según pestaña y permiso.
 * @param {LmsTab} tab Pestaña activa.
 * @param {LmsTab} actual Pestaña que quiero pintar.
 * @param {boolean} permitido Si ese rol la puede ver.
 * @returns {boolean} Si pinto ese panel.
 */
export function lmsMuestraPanel(tab: LmsTab, actual: LmsTab, permitido: boolean): boolean {
  return tab === actual && permitido;
}
