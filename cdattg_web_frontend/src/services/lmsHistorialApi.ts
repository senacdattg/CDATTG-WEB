/**
 * @module services/lmsHistorialApi
 * @description Cliente del historial de notas del aula.
 * Lo separé de lmsApi para no pasar de 150 líneas.
 * @author Cristian Deysdayr Jiménez
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type { LmsHistorialFila } from '../types/lms';

const http = axios.create({ baseURL: API_BASE_URL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Notas de todos los aprendices en las actividades del instructor.
 * @param {number} fichaId Ficha del aula.
 * @returns {Promise<LmsHistorialFila[]>} Filas de la tabla.
 */
export async function fetchLmsHistorial(fichaId: number): Promise<LmsHistorialFila[]> {
  const res = await http.get<{ data: LmsHistorialFila[] }>(`/lms/aulas/${fichaId}/calificaciones`);
  return res.data.data ?? [];
}
