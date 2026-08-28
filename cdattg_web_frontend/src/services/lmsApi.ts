/**
 * @module services/lmsApi
 * @description Cliente HTTP del LMS. Reutiliza token de sesión.
 * @author Cristian Deysdayr Jiménez
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { LmsActividadDetalle, LmsActividadItem, LmsAulaDetalle, LmsAulaListItem, LmsEntregaItem } from '../types/lms';

const http = axios.create({ baseURL: API_BASE_URL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

async function downloadBlob(url: string, nombre: string): Promise<void> {
  const res = await http.get<Blob>(url, { responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = href;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(href);
}

/** Lista aulas del usuario. */
export async function fetchLmsAulas(): Promise<LmsAulaListItem[]> {
  const res = await http.get<{ data: LmsAulaListItem[] }>('/lms/aulas');
  return res.data.data ?? [];
}

/** Detalle de un aula. */
export async function fetchLmsAula(fichaId: number): Promise<LmsAulaDetalle> {
  const res = await http.get<LmsAulaDetalle>(`/lms/aulas/${fichaId}`);
  return res.data;
}

/** Publica en el tablón. */
export async function createLmsActividad(fichaId: number, body: FormData): Promise<LmsActividadItem> {
  const res = await http.post<LmsActividadItem>(`/lms/aulas/${fichaId}/actividades`, body);
  return res.data;
}

/** Edita una publicación del instructor. */
export async function updateLmsActividad(
  fichaId: number,
  actividadId: number,
  body: FormData,
): Promise<LmsActividadItem> {
  const res = await http.put<LmsActividadItem>(`/lms/aulas/${fichaId}/actividades/${actividadId}`, body);
  return res.data;
}

/** Detalle de actividad (alumno o instructor). */
export async function fetchLmsActividad(fichaId: number, actividadId: number): Promise<LmsActividadDetalle> {
  const res = await http.get<LmsActividadDetalle>(`/lms/aulas/${fichaId}/actividades/${actividadId}`);
  return res.data;
}

/** Entrega de archivos del aprendiz. */
export async function entregarLmsActividad(fichaId: number, actividadId: number, body: FormData): Promise<LmsEntregaItem> {
  const res = await http.post<LmsEntregaItem>(`/lms/aulas/${fichaId}/actividades/${actividadId}/entregas`, body);
  return res.data;
}

/** Deshace el envío para que el aprendiz pueda editar archivos. */
export async function deshacerLmsEntrega(fichaId: number, actividadId: number): Promise<LmsEntregaItem> {
  const res = await http.post<LmsEntregaItem>(`/lms/aulas/${fichaId}/actividades/${actividadId}/entregas/deshacer`);
  return res.data;
}

/** Nota 0-100 y comentario del instructor. */
export async function calificarLmsEntrega(
  fichaId: number,
  actividadId: number,
  entregaId: number,
  body: { calificacion: number | null; comentario: string },
): Promise<LmsEntregaItem> {
  const res = await http.put<LmsEntregaItem>(
    `/lms/aulas/${fichaId}/actividades/${actividadId}/entregas/${entregaId}/nota`,
    body,
  );
  return res.data;
}

/** Trae un archivo autenticado como PDF para verlo en el navegador. */
async function blobPdfDeUrl(url: string): Promise<Blob> {
  const res = await http.get<Blob>(url, { responseType: 'blob' });
  return new Blob([res.data], { type: 'application/pdf' });
}

/** Descarga adjunto de la publicación. */
export async function downloadLmsArchivo(fichaId: number, actividadId: number, archivoId: number, nombre: string) {
  return downloadBlob(`/lms/aulas/${fichaId}/actividades/${actividadId}/archivos/${archivoId}`, nombre);
}

/** PDF de una entrega para vista previa (no fuerza descarga). */
export async function blobLmsEntregaArchivo(
  fichaId: number,
  actividadId: number,
  entregaId: number,
  archivoId: number,
): Promise<Blob> {
  return blobPdfDeUrl(
    `/lms/aulas/${fichaId}/actividades/${actividadId}/entregas/${entregaId}/archivos/${archivoId}`,
  );
}

/** PDF de un adjunto de la publicación (crear/editar/ver). */
export async function blobLmsActividadArchivo(
  fichaId: number,
  actividadId: number,
  archivoId: number,
): Promise<Blob> {
  return blobPdfDeUrl(`/lms/aulas/${fichaId}/actividades/${actividadId}/archivos/${archivoId}`);
}

/** Descarga adjunto de una entrega. */
export async function downloadLmsEntregaArchivo(
  fichaId: number,
  actividadId: number,
  entregaId: number,
  archivoId: number,
  nombre: string,
) {
  return downloadBlob(
    `/lms/aulas/${fichaId}/actividades/${actividadId}/entregas/${entregaId}/archivos/${archivoId}`,
    nombre,
  );
}
