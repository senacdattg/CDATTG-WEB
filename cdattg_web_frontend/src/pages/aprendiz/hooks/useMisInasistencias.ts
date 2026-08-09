import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../services/api';
import { axiosErrorMessage } from '../../../utils/httpError';
import type { MisInasistenciasFichaOpcion, MisInasistenciasResponse } from '../../../types';

const DIAS_HISTORICO = 0;

const DIAS_OPCIONES = [
  { value: 30, label: 'Últimos 30 días' },
  { value: 60, label: 'Últimos 60 días' },
  { value: 90, label: 'Últimos 90 días' },
  { value: DIAS_HISTORICO, label: 'Desde el origen de los tiempos' },
] as const;

export function useMisInasistencias(enabled: boolean) {
  const [dias, setDias] = useState<number>(30);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [fichas, setFichas] = useState<MisInasistenciasFichaOpcion[]>([]);
  const [data, setData] = useState<MisInasistenciasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const params: { dias?: number; ficha_id?: number } = { dias };
      if (fichaId != null && fichaId > 0) params.ficha_id = fichaId;
      const resp = await apiService.getMisInasistencias(params);
      setData(resp);
      if (resp.fichas?.length) {
        setFichas(resp.fichas);
        if (fichaId == null && resp.ficha_id) {
          setFichaId(resp.ficha_id);
        }
      }
    } catch (err) {
      setData(null);
      setError(axiosErrorMessage(err, 'No se pudo cargar el detalle de inasistencias.'));
    } finally {
      setLoading(false);
    }
  }, [dias, enabled, fichaId]);

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
    fichaId,
    setFichaId,
    fichas,
    data,
    loading,
    error,
    recargar: cargar,
  };
}
