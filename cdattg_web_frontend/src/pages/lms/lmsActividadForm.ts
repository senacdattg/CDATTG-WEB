/**
 * @module pages/lms/lmsActividadForm
 * @description Validación y FormData compartidos al publicar o editar.
 * @author Cristian Deysdayr Jiménez
 */
import { mensajeArchivosFueraDeLimite } from './lmsArchivoLimite';
import { combinarPlazo } from './lmsPlazo';
import type { LmsActividadItem } from '../../types/lms';

export type LmsActividadFormInitial = Pick<
  LmsActividadItem,
  'titulo' | 'cuerpo' | 'calificacion_max' | 'plazo_entrega'
>;

export type LmsActividadFormVals = Readonly<{
  titulo: string;
  cuerpo: string;
  puntos: string;
  fecha: string;
  hora: string;
  files: File[];
}>;

/**
 * Primer error de validación, o cadena vacía si el formulario es válido.
 * @param {LmsActividadFormVals} v Valores del formulario de actividad.
 * @returns {string} Mensaje de error o vacío.
 */
export function errorActividadForm(v: LmsActividadFormVals): string {
  if (v.titulo.trim() === '') return 'El título es obligatorio';
  const n = Number(v.puntos);
  if (Number.isNaN(n) || n < 0 || n > 100) return 'Los puntos deben estar entre 0 y 100';
  if (combinarPlazo(v.fecha, v.hora) === '') return 'El plazo de entrega es obligatorio';
  return mensajeArchivosFueraDeLimite(v.files) ?? '';
}

/**
 * Arma el multipart de alta o edición.
 * @param {LmsActividadFormVals} v Valores ya validados.
 * @returns {FormData} Cuerpo para el API.
 */
export function buildActividadFormData(v: LmsActividadFormVals): FormData {
  const body = new FormData();
  body.append('titulo', v.titulo.trim());
  body.append('cuerpo', v.cuerpo.trim());
  body.append('calificacion_max', String(Number(v.puntos)));
  body.append('plazo_entrega', combinarPlazo(v.fecha, v.hora));
  v.files.forEach((f) => body.append('archivos', f));
  return body;
}

/**
 * Textos del encabezado y del botón según alta o edición.
 * @param {boolean} editar True si el instructor está modificando.
 * @param {boolean} saving True mientras se envía.
 * @returns {{titulo: string, pista: string, boton: string}} Copys de la cabecera y del botón.
 */
export function etiquetasActividadForm(editar: boolean, saving: boolean): { titulo: string; pista: string; boton: string } {
  if (editar) {
    return {
      titulo: 'Editar actividad',
      pista: 'Modifique título, puntos, descripción, plazo o agregue archivos.',
      boton: saving ? 'Guardando…' : 'Guardar cambios',
    };
  }
  return {
    titulo: 'Publicar actividad',
    pista: 'Título, puntos 0-100, descripción y plazo de entrega. Los archivos son opcionales.',
    boton: saving ? 'Publicando…' : 'Publicar actividad',
  };
}
