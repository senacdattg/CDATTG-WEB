/**
 * @module types/lms
 * @description Contratos JSON del módulo LMS (aulas, actividades y entregas).
 * @author CRANDEYS
 * @created 2026-08-26
 */

export type LmsActividadTipo = 'TABLON' | 'GUIA' | 'MATERIAL' | 'TRABAJO';

export interface LmsAulaListItem {
  ficha_id: number;
  numero_ficha: string;
  nombre_programa: string;
  tipo_formacion: string;
  puede_publicar: boolean;
  cantidad_aprendices: number;
  instructor_nombre?: string;
  sede_nombre?: string;
  ambiente_nombre?: string;
  jornada_nombre?: string;
  modalidad_formacion_nombre?: string;
  status?: boolean;
}

export interface LmsAulaAprendiz {
  id: number;
  persona_id: number;
  nombre: string;
  documento: string;
  estado?: boolean;
  oculto_en_asistencia?: boolean;
}

export interface LmsArchivoItem {
  id: number;
  nombre: string;
  tamano: number;
}

export interface LmsActividadItem {
  id: number;
  tipo: string;
  titulo: string;
  cuerpo: string;
  habilita_carga: boolean;
  calificacion_max: number | null;
  plazo_entrega: string | null;
  creado_en: string;
  instructor_nombre?: string;
  archivos: LmsArchivoItem[];
}

export interface LmsEntregaItem {
  id: number;
  aprendiz_id: number;
  aprendiz_nombre: string;
  documento: string;
  entregado_en: string;
  tardia: boolean;
  calificacion: number | null;
  comentario_instructor: string;
  archivos: LmsArchivoItem[];
}

export interface LmsActividadDetalle extends LmsActividadItem {
  puede_publicar: boolean;
  mi_entrega: LmsEntregaItem | null;
  entregas: LmsEntregaItem[];
}

export interface LmsAulaDetalle {
  ficha_id: number;
  numero_ficha: string;
  nombre_programa: string;
  tipo_formacion: string;
  puede_publicar: boolean;
  aprendices: LmsAulaAprendiz[];
  actividades: LmsActividadItem[];
}
