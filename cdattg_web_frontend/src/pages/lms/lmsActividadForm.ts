/**
 * @module pages/lms/lmsActividadForm
 * @description Validación y FormData compartidos al publicar o editar.
 * @author CRANDEYS
 * @created 2026-08-26
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
  conPlazo: boolean;
  fecha: string;
  hora: string;
  files: File[];
}>;

/**
 * Primer error de validación, o cadena vacía si el formulario es válido.
 * @param v Valores del formulario de actividad.
 */
export function errorActividadForm(v: LmsActividadFormVals): string {
  if (v.titulo.trim() === '') return 'El título es obligatorio';
  const n = Number(v.puntos);
  if (Number.isNaN(n) || n < 0 || n > 100) return 'Los puntos deben estar entre 0 y 100';
  if (v.conPlazo && combinarPlazo(v.fecha, v.hora) === '') return 'Indique la fecha de entrega';
  return mensajeArchivosFueraDeLimite(v.files) ?? '';
}

/**
 * Arma el multipart de alta o edición.
 * @param v Valores ya validados.
 */
export function buildActividadFormData(v: LmsActividadFormVals): FormData {
  const body = new FormData();
  body.append('titulo', v.titulo.trim());
  body.append('cuerpo', v.cuerpo.trim());
  body.append('calificacion_max', String(Number(v.puntos)));
  if (v.conPlazo) body.append('plazo_entrega', combinarPlazo(v.fecha, v.hora));
  v.files.forEach((f) => body.append('archivos', f));
  return body;
}

/**
 * Textos del encabezado y del botón según alta o edición.
 * @param editar True si el instructor está modificando.
 * @param saving True mientras se envía.
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
    pista: 'Título, puntos 0-100, descripción y, si aplica, documentos y plazo.',
    boton: saving ? 'Publicando…' : 'Publicar en el tablón',
  };
}
