/**
 * @module pages/lms/lmsActividadVista
 * @description Elige si la actividad es de instructor, de entrega o solo lectura.
 * Lo hice porque al quitar INSTRUCTOR no debe aparecer Adjuntar ni Publicar.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsEntregaItem } from '../../types/lms';

/**
 * Entrega del aprendiz. Si no publica y no entrega, solo mira instrucciones.
 * @param {boolean} puedePublicar Instructor vigente de la ficha.
 * @param {boolean} [puedeEntregar] Aprendiz que puede subir.
 * @returns {boolean} true si muestro Mi trabajo.
 */
export function lmsMuestraEntregaAlumno(puedePublicar: boolean, puedeEntregar?: boolean): boolean {
  return !puedePublicar && puedeEntregar !== false;
}

/**
 * Busca la fila de un aprendiz en el listado de entregas.
 * @param {LmsEntregaItem[]} entregas Filas del instructor.
 * @param {number} aprendizId Aprendiz de la ficha.
 */
export function lmsEntregaDeAprendiz(entregas: LmsEntregaItem[], aprendizId: number): LmsEntregaItem | undefined {
  return entregas.find((e) => e.aprendiz_id === aprendizId);
}

/**
 * Instructor o superadministrador: ven notas; solo el primero califica.
 * @param {{ puede_publicar?: boolean; puede_ver_historial?: boolean }} flags Permisos del aula.
 * @returns {boolean} Si muestro historial y entregas.
 */
export function lmsVeNotas(flags: { puede_publicar?: boolean; puede_ver_historial?: boolean }): boolean {
  return Boolean(flags.puede_publicar || flags.puede_ver_historial);
}
