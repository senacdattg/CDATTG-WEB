/**
 * @module services/portalApi
 * @description Cliente HTTP público y autenticado del portal / semilleros.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import type {
  PortalBannerItem,
  PortalHomeResponse,
  PortalPresentacionItem,
  SemilleroItem,
} from '../types/portal';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../types';

const publicClient = axios.create({ baseURL: API_BASE_URL });

const authClient = axios.create({ baseURL: API_BASE_URL });
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export const portalApi = {
  home: async () => (await publicClient.get<PortalHomeResponse>('/public/portal')).data,
  semillerosPublicos: async () =>
    (await publicClient.get<{ data: SemilleroItem[] }>('/public/semilleros')).data.data,
  semilleroPublico: async (slug: string) =>
    (await publicClient.get<SemilleroItem>(`/public/semilleros/${slug}`)).data,
  catalogoPaises: async () =>
    (await publicClient.get<{ data: PaisItem[] }>('/public/catalogos/paises')).data.data,
  catalogoDepartamentos: async (paisId: number) =>
    (await publicClient.get<{ data: DepartamentoItem[] }>('/public/catalogos/departamentos', { params: { pais_id: paisId } })).data.data,
  catalogoMunicipios: async (departamentoId: number) =>
    (await publicClient.get<{ data: MunicipioItem[] }>('/public/catalogos/municipios', { params: { departamento_id: departamentoId } })).data.data,
  catalogoTiposDocumento: async () =>
    (await publicClient.get<{ data: ParametroItem[] }>('/public/catalogos/tipos-documento')).data.data,
  catalogoGeneros: async () =>
    (await publicClient.get<{ data: ParametroItem[] }>('/public/catalogos/generos')).data.data,
  catalogoCaracterizacion: async () =>
    (await publicClient.get<{ data: ParametroItem[] }>('/public/catalogos/persona-caracterizacion')).data.data,
  listarSemillerosAdmin: async () =>
    (await authClient.get<{ data: SemilleroItem[] }>('/semilleros')).data.data,
  obtenerSemillero: async (id: number) => (await authClient.get<SemilleroItem>(`/semilleros/${id}`)).data,
  crearSemillero: async (body: Partial<SemilleroItem>) =>
    (await authClient.post<SemilleroItem>('/semilleros', body)).data,
  actualizarSemillero: async (id: number, body: Partial<SemilleroItem>) =>
    (await authClient.put<SemilleroItem>(`/semilleros/${id}`, body)).data,
  eliminarSemillero: async (id: number) => {
    await authClient.delete(`/semilleros/${id}`);
  },
  listarBanners: async () =>
    (await authClient.get<{ data: PortalBannerItem[] }>('/portal/banners')).data.data,
  crearBanner: async (body: Partial<PortalBannerItem>) =>
    (await authClient.post<PortalBannerItem>('/portal/banners', body)).data,
  actualizarBanner: async (id: number, body: Partial<PortalBannerItem>) =>
    (await authClient.put<PortalBannerItem>(`/portal/banners/${id}`, body)).data,
  eliminarBanner: async (id: number) => {
    await authClient.delete(`/portal/banners/${id}`);
  },
  obtenerPresentacion: async () =>
    (await authClient.get<PortalPresentacionItem>('/portal/presentacion')).data,
  guardarPresentacion: async (body: Partial<PortalPresentacionItem>) =>
    (await authClient.put<PortalPresentacionItem>('/portal/presentacion', body)).data,
  subirArchivo: async (file: File) => {
    const data = new FormData();
    data.append('archivo', file);
    return (await authClient.post<{ nombre: string; url: string }>('/portal/archivos', data)).data;
  },
};

/**
 * URL absoluta o de mismo origen para una imagen del portal.
 */
export function portalMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  if (path.startsWith('/')) return `${origin}${path}`;
  return `${origin}/api/public/portal/archivos/${path}`;
}
