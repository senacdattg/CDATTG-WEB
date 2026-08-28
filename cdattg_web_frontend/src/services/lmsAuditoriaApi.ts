/**
 * @module services/lmsAuditoriaApi
 * @description Cliente HTTP de la auditoría LMS.
 * @author Cristian Deysdayr Jiménez
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type {
  LmsAuditoriaBusqueda,
  LmsAuditoriaPersonaDetalle,
  LmsAuditoriaPersonaItem,
  LmsAuditoriaTipoDetalle,
} from '../types/lmsAuditoria';

const http = axios.create({ baseURL: API_BASE_URL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Lista carpetas raíz (página de 20) o tarjetas si el filtro es ficha. */
export async function buscarLmsAuditoria(q: string, page = 1): Promise<LmsAuditoriaBusqueda> {
  const res = await http.get<{ data: LmsAuditoriaBusqueda }>('/lms/auditoria/personas', {
    params: { q, page, page_size: 20 },
  });
  const data = res.data.data;
  return {
    fichas: data?.fichas ?? [],
    personas: data?.personas ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    page_size: data?.page_size ?? 20,
  };
}

/** Carpetas raíz de las personas de una ficha. */
export async function fetchLmsAuditoriaFicha(fichaId: number): Promise<LmsAuditoriaPersonaItem[]> {
  const res = await http.get<{ data: LmsAuditoriaPersonaItem[] }>(`/lms/auditoria/fichas/${fichaId}/personas`);
  return res.data.data ?? [];
}

/** Abre la raíz y las tres carpetas de tipo. */
export async function fetchLmsAuditoriaPersona(personaId: number): Promise<LmsAuditoriaPersonaDetalle> {
  const res = await http.get<LmsAuditoriaPersonaDetalle>(`/lms/auditoria/personas/${personaId}`);
  return res.data;
}

/** Fichas y entregas de un tipo de formación. */
export async function fetchLmsAuditoriaTipo(personaId: number, tipo: string): Promise<LmsAuditoriaTipoDetalle> {
  const res = await http.get<LmsAuditoriaTipoDetalle>(
    `/lms/auditoria/personas/${personaId}/tipos/${encodeURIComponent(tipo)}`,
  );
  return res.data;
}
