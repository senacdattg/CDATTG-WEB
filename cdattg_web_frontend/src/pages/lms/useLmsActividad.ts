/**
 * @module pages/lms/useLmsActividad
 * @description Carga una actividad y permite entregar o deshacer el trabajo.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useCallback, useEffect, useState } from 'react';
import { deshacerLmsEntrega, entregarLmsActividad, fetchLmsActividad } from '../../services/lmsApi';
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
  const [saving, setSaving] = useState(false);

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

  const entregar = useCallback(
    async (files: File[]) => {
      if (!fichaId || !actividadId) return;
      const body = new FormData();
      files.forEach((f) => body.append('archivos', f));
      setSaving(true);
      try {
        await entregarLmsActividad(fichaId, actividadId, body);
        await recargar();
      } catch (cause: unknown) {
        throw new Error(axiosErrorMessage(cause, 'No se pudo entregar'));
      } finally {
        setSaving(false);
      }
    },
    [fichaId, actividadId, recargar],
  );

  const deshacer = useCallback(async () => {
    if (!fichaId || !actividadId) return;
    setSaving(true);
    try {
      await deshacerLmsEntrega(fichaId, actividadId);
      await recargar();
    } catch (cause: unknown) {
      throw new Error(axiosErrorMessage(cause, 'No se pudo deshacer la entrega'));
    } finally {
      setSaving(false);
    }
  }, [fichaId, actividadId, recargar]);

  return { detalle, loading, error, saving, recargar, entregar, deshacer };
}
