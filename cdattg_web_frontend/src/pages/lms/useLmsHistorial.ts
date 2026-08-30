/**
 * @module pages/lms/useLmsHistorial
 * @description Carga las filas del historial de calificaciones.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { fetchLmsHistorial } from '../../services/lmsHistorialApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { LmsHistorialFila } from '../../types/lms';

/**
 * Lista de notas de la ficha.
 * @param {number} fichaId Aula actual.
 */
export function useLmsHistorial(fichaId: number) {
  const [filas, setFilas] = useState<LmsHistorialFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargo de nuevo si cambia el aula. Cancelo si se sale de la pestaña.
  useEffect(() => {
    let vivo = true;
    setLoading(true);
    setError('');
    fetchLmsHistorial(fichaId)
      .then((list) => {
        if (vivo) setFilas(list);
      })
      .catch((cause: unknown) => {
        if (vivo) setError(axiosErrorMessage(cause, 'No se pudo cargar el historial'));
      })
      .finally(() => {
        if (vivo) setLoading(false);
      });
    return () => {
      vivo = false;
    };
  }, [fichaId]);

  return { filas, loading, error };
}
