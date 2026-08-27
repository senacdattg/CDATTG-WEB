/**
 * @module types/portal
 * @description Contratos JSON del portal público y semilleros.
 * @author Cristian Deysdayr Jiménez
 */

export type PortalEstado = 'borrador' | 'publicado' | 'archivado';

export interface PortalBannerItem {
  id: number;
  titulo: string;
  descripcion: string;
  imagen_url: string;
  etiqueta: string;
  boton_texto: string;
  enlace_url: string;
  orden: number;
  vigente_desde?: string | null;
  vigente_hasta?: string | null;
  estado_publicacion: PortalEstado;
}

export interface PortalPresentacionItem {
  id?: number;
  mision: string;
  vision: string;
  objetivo_general: string;
  historia: string;
  video_url: string;
  politicas_pdf: string;
  equipo: string;
  estado_publicacion: PortalEstado;
}

export interface PortalHomeResponse {
  banners: PortalBannerItem[];
  presentacion: PortalPresentacionItem | null;
}

export interface InvestigacionHomeResponse {
  banners: PortalBannerItem[];
  semilleros: SemilleroItem[];
  presentacion: PortalPresentacionItem | null;
}

export interface SemilleroLineaItem {
  id?: number;
  /** Clave de React para filas nuevas aún sin id. */
  clave?: string;
  nombre: string;
  descripcion: string;
  orden?: number;
  estado_publicacion?: PortalEstado;
}

export interface SemilleroIntegranteItem {
  id?: number;
  /** Clave de React para filas nuevas aún sin id. */
  clave?: string;
  nombre: string;
  rol: string;
  programa?: string;
  correo: string;
  orden?: number;
  estado_publicacion?: PortalEstado;
}

export interface SemilleroProyectoItem {
  id?: number;
  /** Clave de React para filas nuevas aún sin id. */
  clave?: string;
  titulo: string;
  resumen: string;
  descripcion?: string;
  estado_ejecucion?: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  anio: number;
  orden?: number;
  estado_publicacion?: PortalEstado;
}

export interface SemilleroItem {
  id: number;
  nombre: string;
  sigla: string;
  slug: string;
  icono: string;
  color_identidad: string;
  resumen: string;
  descripcion: string;
  mision: string;
  vision: string;
  objetivos: string;
  instructor_lider: string;
  correo_contacto: string;
  imagen_url: string;
  orden: number;
  estado_publicacion: PortalEstado;
  lineas?: SemilleroLineaItem[];
  integrantes?: SemilleroIntegranteItem[];
  proyectos?: SemilleroProyectoItem[];
}
