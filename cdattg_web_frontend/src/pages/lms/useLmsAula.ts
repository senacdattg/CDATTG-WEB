/**
 * @module pages/lms/useLmsAula
 * @description Carga el aula y permite publicar, editar o eliminar actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useState } from 'react';
import { createLmsActividad, deleteLmsActividad, fetchLmsAula, updateLmsActividad } from '../../services/lmsApi';
import { axiosErrorMessage } from '../../utils/httpError';
import type { LmsAulaDetalle } from '../../types/lms';

/**
 * Hook del aula por ficha.
 * @param {number | null} fichaId Ficha actual.
 */
export function useLmsAula(fichaId: number | null) {
  const [aula, setAula] = useState<LmsAulaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const recargar = useCallback(async () => {
    if (!fichaId) {
      setAula(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setAula(await fetchLmsAula(fichaId));
    } catch (cause: unknown) {
      setAula(null);
      setError(axiosErrorMessage(cause, 'No se pudo abrir el aula'));
    } finally {
      setLoading(false);
    }
  }, [fichaId]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const publicar = useCallback(
    async (body: FormData) => {
      if (!fichaId) return;
      setSaving(true);
      try {
        await createLmsActividad(fichaId, body);
        await recargar();
      } catch (cause: unknown) {
        throw new Error(axiosErrorMessage(cause, 'No se pudo publicar'));
      } finally {
        setSaving(false);
      }
    },
    [fichaId, recargar],
  );

  const editar = useCallback(
    async (actividadId: number, body: FormData) => {
      if (!fichaId) return;
      setSaving(true);
      try {
        await updateLmsActividad(fichaId, actividadId, body);
        await recargar();
      } catch (cause: unknown) {
        throw new Error(axiosErrorMessage(cause, 'No se pudo guardar'));
      } finally {
        setSaving(false);
      }
    },
    [fichaId, recargar],
  );

  const eliminar = useCallback(
    async (actividadId: number) => {
      if (!fichaId) return;
      setSaving(true);
      try {
        await deleteLmsActividad(fichaId, actividadId);
        await recargar();
      } catch (cause: unknown) {
        throw new Error(axiosErrorMessage(cause, 'No se pudo eliminar'));
      } finally {
        setSaving(false);
      }
    },
    [fichaId, recargar],
  );

  return { aula, loading, error, saving, recargar, publicar, editar, eliminar };
}
