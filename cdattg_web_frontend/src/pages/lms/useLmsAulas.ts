/**
 * @module pages/lms/useLmsAulas
 * @description Carga el catálogo de aulas LMS del usuario.
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useState } from 'react';
import { fetchLmsAulas } from '../../services/lmsApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { LmsAulaListItem } from '../../types/lms';

/**
 * Hook de listado de aulas.
 * @returns Estado de carga, error y aulas.
 */
export function useLmsAulas() {
  const [aulas, setAulas] = useState<LmsAulaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAulas(await fetchLmsAulas());
    } catch (cause: unknown) {
      setAulas([]);
      setError(axiosErrorMessage(cause, 'No se pudieron cargar las aulas'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { aulas, loading, error, recargar };
}
