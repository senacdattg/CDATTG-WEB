/**
 * @module pages/semillero/editorialFormState
 * @description Estado vacío de un contenido editorial.
 * @author Cristian Deysdayr Jiménez
 */
import type { BiogjgasItem } from '../../types/biogjgas';

export const editorialVacio: BiogjgasItem = {
  id: 0,
  titulo: '',
  orden: 0,
  estado_publicacion: 'publicado',
};

/**
 * Cuerpo JSON para crear o actualizar (omite id).
 */
export function editorialARequest(form: BiogjgasItem): Partial<BiogjgasItem> {
  const { id: _id, ...rest } = form;
  return rest;
}
