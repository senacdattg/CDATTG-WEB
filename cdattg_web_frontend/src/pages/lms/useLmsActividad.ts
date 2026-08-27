/**
 * @module pages/lms/useLmsActividad
 * @description Carga el detalle de una actividad del aula.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchLmsActividad } from '../../services/lmsApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { LmsActividadDetalle } from '../../types/lms';

/**
 * Hook de la vista de actividad.
 * @param fichaId Ficha del aula o null si la ruta es inválida.
 * @param actividadId Publicación o null si la ruta es inválida.
 */
export function useLmsActividad(fichaId: number | null, actividadId: number | null) {
  const [detalle, setDetalle] = useState<LmsActividadDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    if (!fichaId || !actividadId) {
      setDetalle(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setDetalle(await fetchLmsActividad(fichaId, actividadId));
    } catch (cause: unknown) {
      setDetalle(null);
      setError(axiosErrorMessage(cause, 'No se pudo abrir la actividad'));
    } finally {
      setLoading(false);
    }
  }, [fichaId, actividadId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { detalle, loading, error, recargar };
}
