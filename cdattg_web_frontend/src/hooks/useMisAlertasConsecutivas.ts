import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { AlertaConsecutivaItem, MisInasistenciasResponse } from '../types';
import { rachaCalendarioDesdeFechas } from '../pages/bienestar/alertas-consecutivas/alertasConsecutivasUtils';

function alertaDesdeMisInasistencias(mis: MisInasistenciasResponse): AlertaConsecutivaItem[] {
  if (Array.isArray(mis.alertas_consecutivas) && mis.alertas_consecutivas.length > 0) {
    return mis.alertas_consecutivas;
  }
  const fechas = rachaCalendarioDesdeFechas((mis.inasistencias ?? []).map((i) => i.fecha));
  if (fechas.length < 2) return [];
  return [
    {
      aprendiz_id: mis.aprendiz_id,
      persona_nombre: '',
      numero_documento: '',
      ficha_numero: mis.ficha_numero,
      sede_nombre: mis.sede_nombre ?? '',
      programa_nombre: mis.programa_nombre,
      fechas_racha: fechas,
      racha_activa: true,
    },
  ];
}

export function useMisAlertasConsecutivas(enabled: boolean, dias = 30) {
  const [alertas, setAlertas] = useState<AlertaConsecutivaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setAlertas([]);
      return;
    }
    let cancelled = false;
    setLoading(true);

    const cargar = async () => {
      try {
        const res = await apiService.getMisAlertasConsecutivas({ dias });
        if (!cancelled && Array.isArray(res.alertas) && res.alertas.length > 0) {
          setAlertas(res.alertas);
          return;
        }
      } catch {
        // El endpoint nuevo puede no existir aún; se usa mis-inasistencias.
      }
      try {
        const mis = await apiService.getMisInasistencias({ dias });
        if (!cancelled) setAlertas(alertaDesdeMisInasistencias(mis));
      } catch {
        if (!cancelled) setAlertas([]);
      }
    };

    void cargar().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, dias]);

  return { alertas, loading };
}
