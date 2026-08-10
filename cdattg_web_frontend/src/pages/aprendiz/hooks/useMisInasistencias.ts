import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { MisInasistenciasFichaOpcion, MisInasistenciasResponse } from '../../../types';

const DIAS_HISTORICO = 0;

export type EstadoFichaMisInasistencias = 'activas' | 'inactivas' | 'todas';

const DIAS_OPCIONES = [
  { value: 30, label: 'Últimos 30 días' },
  { value: 60, label: 'Últimos 60 días' },
  { value: 90, label: 'Últimos 90 días' },
  { value: DIAS_HISTORICO, label: 'Desde el origen de los tiempos' },
] as const;

export const ESTADO_FICHA_OPCIONES: { value: EstadoFichaMisInasistencias; label: string }[] = [
  { value: 'activas', label: 'Activas' },
  { value: 'inactivas', label: 'Inactivas' },
  { value: 'todas', label: 'Todas' },
];

export function useMisInasistencias(enabled: boolean) {
  const [dias, setDias] = useState<number>(30);
  const [estadoFicha, setEstadoFicha] = useState<EstadoFichaMisInasistencias>('activas');
  const [tipoFormacion, setTipoFormacion] = useState('');
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [fichas, setFichas] = useState<MisInasistenciasFichaOpcion[]>([]);
  const [data, setData] = useState<MisInasistenciasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cambiarEstadoFicha = useCallback((next: EstadoFichaMisInasistencias) => {
    setEstadoFicha(next);
    setFichaId(null);
  }, []);

  const cambiarTipoFormacion = useCallback((next: string) => {
    setTipoFormacion(next);
    setFichaId(null);
  }, []);

  const cargar = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const params: {
        dias?: number;
        ficha_id?: number;
        estado_ficha?: EstadoFichaMisInasistencias;
        tipo_formacion?: string;
      } = { dias, estado_ficha: estadoFicha };
      if (fichaId != null && fichaId > 0) params.ficha_id = fichaId;
      if (tipoFormacion) params.tipo_formacion = tipoFormacion;
      const resp = await apiService.getMisInasistencias(params);
      setData(resp);
      const lista = resp.fichas ?? [];
      setFichas(lista);
      if (lista.length === 0) {
        setFichaId(null);
      } else if (fichaId == null || !lista.some((f) => f.ficha_id === fichaId)) {
        setFichaId(resp.ficha_id ?? lista[0].ficha_id);
      }
    } catch (err) {
      setData(null);
      setFichas([]);
      setError(axiosErrorMessage(err, 'No se pudo cargar el detalle de inasistencias.'));
    } finally {
      setLoading(false);
    }
  }, [dias, enabled, estadoFicha, fichaId, tipoFormacion]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void cargar();
  }, [cargar, enabled]);

  return {
    dias,
    setDias,
    diasOpciones: DIAS_OPCIONES,
    estadoFicha,
    setEstadoFicha: cambiarEstadoFicha,
    estadoFichaOpciones: ESTADO_FICHA_OPCIONES,
    tipoFormacion,
    setTipoFormacion: cambiarTipoFormacion,
    fichaId,
    setFichaId,
    fichas,
    data,
    loading,
    error,
    recargar: cargar,
  };
}
