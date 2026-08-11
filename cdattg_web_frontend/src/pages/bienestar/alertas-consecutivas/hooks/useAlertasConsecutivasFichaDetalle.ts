import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { apiService } from '../../../../services/api';
import type { AlertaConsecutivaItem } from '../../../../types';
import { hoyISOColombia } from '../../../../utils/formatFecha';
import { axiosErrorMessage } from '../../../../utils/httpError';
import { canViewCasosBienestar, MENSAJE_SIN_PERMISO_CASOS_BIENESTAR } from '../../casos/casosBienestarPermissions';
import { etiquetaPeriodoCasosBienestar, parseDiasCasosBienestarParam } from '../../casos/casosBienestarUtils';
import { alertasDeFicha, filtrarAlertasAprendiz } from '../alertasConsecutivasUtils';
import { generarOficioAlertaConsecutivaPdf } from '../oficioSenaAlertasPdf';
import { cargoGeneradorDesdeRoles } from '../oficioSenaAlertasTexto';
import { useAlertasConsecutivas } from './useAlertasConsecutivas';

export function useAlertasConsecutivasFichaDetalle() {
  const { user, roles } = useAuth();
  const [oficioGenerandoId, setOficioGenerandoId] = useState<number | null>(null);
  const [oficioError, setOficioError] = useState('');
  const { fichaNumero } = useParams<{ fichaNumero: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const canView = canViewCasosBienestar(roles);

  const dias = parseDiasCasosBienestarParam(searchParams.get('dias'));
  const sedeNombreParam = searchParams.get('sede') || '';
  const tipoFormacion = searchParams.get('tipo_formacion') || '';

  const setDias = useCallback(
    (value: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('dias', String(value));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setTipoFormacion = useCallback(
    (value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set('tipo_formacion', value);
          else next.delete('tipo_formacion');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, error, setError, setLoading } = useAlertasConsecutivas({
    enabled: canView && Boolean(fichaNumero),
    dias,
    tipoFormacion,
  });

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      setError(MENSAJE_SIN_PERMISO_CASOS_BIENESTAR);
      return;
    }
    if (!fichaNumero) {
      setLoading(false);
      setError('Ficha no especificada.');
    }
  }, [canView, fichaNumero, setError, setLoading]);

  const alertasFichaTotal = useMemo(
    () =>
      data && fichaNumero
        ? alertasDeFicha(data.alertas ?? [], decodeURIComponent(fichaNumero), sedeNombreParam)
        : [],
    [data, fichaNumero, sedeNombreParam],
  );

  const alertasFicha = useMemo(() => {
    const filtradas = filtrarAlertasAprendiz(alertasFichaTotal, searchQuery);
    return [...filtradas].sort((a, b) => {
      const diasB = b.fechas_racha?.length ?? 0;
      const diasA = a.fechas_racha?.length ?? 0;
      if (diasB !== diasA) return diasB - diasA;
      if (a.racha_activa !== b.racha_activa) return a.racha_activa ? -1 : 1;
      return a.persona_nombre.localeCompare(b.persona_nombre, 'es');
    });
  }, [alertasFichaTotal, searchQuery]);

  const meta = alertasFichaTotal[0];
  const sedeNombre = sedeNombreParam || meta?.sede_nombre || '';
  const programaNombre = meta?.programa_nombre || '';
  const jornadaNombre = meta?.jornada_nombre || '';
  const activas = alertasFichaTotal.filter((a) => a.racha_activa).length;
  const busquedaActiva = Boolean(searchQuery.trim());

  const generarOficioAprendiz = useCallback(
    async (alerta: AlertaConsecutivaItem) => {
      if (!fichaNumero || oficioGenerandoId != null) return;
      if (!user?.id) {
        setOficioError('No hay sesión activa para identificar al instructor que genera el oficio.');
        return;
      }
      setOficioError('');
      setOficioGenerandoId(alerta.aprendiz_id);
      try {
        let totalInasistencias = alerta.fechas_racha?.length ?? 0;
        try {
          const detalle = await apiService.getCasoBienestarAprendizDetalle(
            decodeURIComponent(fichaNumero),
            alerta.aprendiz_id,
            { dias },
          );
          totalInasistencias = detalle.inasistencias?.length ?? totalInasistencias;
        } catch {
          // El oficio puede emitirse con el conteo de días de racha si falla el detalle.
        }

        await generarOficioAlertaConsecutivaPdf({
          aprendizId: alerta.aprendiz_id,
          aprendizNombre: alerta.persona_nombre,
          numeroDocumento: alerta.numero_documento,
          programaNombre: alerta.programa_nombre || programaNombre,
          fichaNumero: alerta.ficha_numero,
          sedeNombre: alerta.sede_nombre || sedeNombre,
          totalInasistencias,
          fechasRacha: alerta.fechas_racha ?? [],
          rachaActiva: alerta.racha_activa,
          periodoEtiqueta: etiquetaPeriodoCasosBienestar(dias, data?.fecha_inicio, data?.fecha_fin),
          generadorNombre: user.full_name?.trim() || user.email,
          generadorCargo: cargoGeneradorDesdeRoles(roles),
          fechaOficioIso: hoyISOColombia(),
        });
      } catch (e: unknown) {
        setOficioError(axiosErrorMessage(e, 'No fue posible generar el oficio PDF. Intente nuevamente.'));
      } finally {
        setOficioGenerandoId(null);
      }
    },
    [data?.fecha_fin, data?.fecha_inicio, dias, fichaNumero, oficioGenerandoId, programaNombre, roles, sedeNombre, user],
  );

  return {
    canView,
    permissionError: canView ? '' : MENSAJE_SIN_PERMISO_CASOS_BIENESTAR,
    fichaNumero: fichaNumero ? decodeURIComponent(fichaNumero) : '',
    sedeNombre,
    programaNombre,
    jornadaNombre,
    activas,
    historicas: alertasFichaTotal.length - activas,
    dias,
    setDias,
    tipoFormacion,
    setTipoFormacion,
    searchQuery,
    setSearchQuery,
    data,
    loading,
    error: canView ? error : MENSAJE_SIN_PERMISO_CASOS_BIENESTAR,
    alertasFicha,
    alertasFichaTotal: alertasFichaTotal.length,
    busquedaActiva,
    generarOficioAprendiz,
    oficioGenerandoId,
    oficioError,
  };
}
