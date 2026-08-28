/**
 * @module types/lmsAuditoria
 * @description Contratos de la auditoría LMS (carpetas y entregas).
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsArchivoItem, LmsAulaListItem } from './lms';

export interface LmsAuditoriaPersonaItem {
  persona_id: number;
  documento: string;
  nombre: string;
  nombre_carpeta: string;
}

export interface LmsAuditoriaTipoItem {
  tipo: string;
  nombre_carpeta: string;
  cantidad_fichas: number;
}

export interface LmsAuditoriaPersonaDetalle extends LmsAuditoriaPersonaItem {
  tipos: LmsAuditoriaTipoItem[];
}

export interface LmsAuditoriaActividadItem {
  actividad_id: number;
  ficha_id: number;
  entrega_id: number;
  titulo: string;
  entregado_en: string;
  calificacion: number | null;
  comentario_instructor: string;
  archivos: LmsArchivoItem[];
}

export interface LmsAuditoriaFichaItem {
  ficha_id: number;
  numero_ficha: string;
  nombre_programa: string;
  nombre_carpeta: string;
  actividades: LmsAuditoriaActividadItem[];
}

export interface LmsAuditoriaTipoDetalle {
  tipo: string;
  nombre_carpeta: string;
  fichas: LmsAuditoriaFichaItem[];
}

export interface LmsAuditoriaFila {
  persona_id: number;
  nombre: string;
  documento: string;
  ficha_id: number;
  numero_ficha: string;
  programa: string;
  regional: string;
  estado: boolean;
  nombre_carpeta: string;
}

export interface LmsAuditoriaBusqueda {
  fichas: LmsAulaListItem[];
  personas: LmsAuditoriaPersonaItem[];
  total: number;
  page: number;
  page_size: number;
}
