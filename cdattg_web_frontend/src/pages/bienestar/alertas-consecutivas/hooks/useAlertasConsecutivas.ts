import { useCallback, useEffect, useState } from 'react';
import { apiService } from '../../../../services/api';
import { axiosErrorMessage } from '../../../../utils/httpError';
import type { AlertasConsecutivasResponse } from '../../../../types';
import { MENSAJE_SIN_PERMISO_CASOS_BIENESTAR } from '../../casos/casosBienestarPermissions';

type UseAlertasConsecutivasParams = Readonly<{
  enabled: boolean;
  dias: number;
  tipoFormacion?: string;
}>;

export function useAlertasConsecutivas({
  enabled,
  dias,
  tipoFormacion = '',
}: UseAlertasConsecutivasParams) {
  const [data, setData] = useState<AlertasConsecutivasResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAlertas = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getAlertasConsecutivas({
        dias,
        tipo_formacion: tipoFormacion || undefined,
      });
      setData(res);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        setError(MENSAJE_SIN_PERMISO_CASOS_BIENESTAR);
      } else {
        setError(axiosErrorMessage(e, 'Error al cargar las alertas consecutivas.'));
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, dias, tipoFormacion]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void fetchAlertas();
  }, [enabled, fetchAlertas]);

  return { data, loading, error, setData, setError, setLoading };
}
