/**
 * @module pages/semillero/semilleroFormState
 * @description Estado inicial del formulario de semillero.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import type {
  SemilleroIntegranteItem,
  SemilleroItem,
  SemilleroLineaItem,
  SemilleroProyectoItem,
} from '../../types/portal';

export const semilleroVacio: SemilleroItem = {
  id: 0,
  nombre: '',
  sigla: '',
  slug: '',
  icono: '',
  color_identidad: '#39A900',
  resumen: '',
  descripcion: '',
  mision: '',
  vision: '',
  objetivos: '',
  instructor_lider: '',
  correo_contacto: '',
  imagen_url: '',
  orden: 0,
  estado_publicacion: 'borrador',
  lineas: [],
  integrantes: [],
  proyectos: [],
};

/**
 * Identificador de fila nueva (no se persiste).
 */
export function claveFila(): string {
  return crypto.randomUUID();
}

/**
 * Clave React: uuid local o id de base de datos.
 */
export function claveHijo(id?: number, clave?: string): string {
  if (clave) return clave;
  return id != null && id > 0 ? `id-${id}` : 'nueva';
}

/**
 * Línea vacía lista para editar.
 */
export function lineaVacia(): SemilleroLineaItem {
  return { clave: claveFila(), nombre: '', descripcion: '', estado_publicacion: 'publicado' };
}

/**
 * Integrante vacío listo para editar.
 */
export function integranteVacio(): SemilleroIntegranteItem {
  return { clave: claveFila(), nombre: '', rol: '', correo: '', programa: '', estado_publicacion: 'publicado' };
}

/**
 * Proyecto vacío listo para editar.
 */
export function proyectoVacio(): SemilleroProyectoItem {
  return {
    clave: claveFila(),
    titulo: '',
    resumen: '',
    anio: new Date().getFullYear(),
    estado_publicacion: 'publicado',
  };
}

/**
 * Quita la clave de UI antes de enviar JSON.
 */
function sinClave<T extends { clave?: string }>(row: T): Omit<T, 'clave'> {
  const copy = { ...row };
  delete copy.clave;
  return copy;
}

/**
 * Cuerpo JSON para crear o actualizar.
 */
export function semilleroARequest(form: SemilleroItem) {
  return {
    nombre: form.nombre,
    sigla: form.sigla,
    slug: form.slug,
    icono: form.icono,
    color_identidad: form.color_identidad,
    resumen: form.resumen,
    descripcion: form.descripcion,
    mision: form.mision,
    vision: form.vision,
    objetivos: form.objetivos,
    instructor_lider: form.instructor_lider,
    correo_contacto: form.correo_contacto,
    imagen_url: form.imagen_url,
    orden: form.orden,
    estado_publicacion: form.estado_publicacion,
    lineas: (form.lineas ?? []).map(sinClave),
    integrantes: (form.integrantes ?? []).map(sinClave),
    proyectos: (form.proyectos ?? []).map(sinClave),
  };
}
