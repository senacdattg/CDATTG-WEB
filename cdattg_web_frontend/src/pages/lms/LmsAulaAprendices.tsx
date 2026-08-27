/**
 * @module pages/lms/LmsAulaAprendices
 * @description Aprendices del aula con el listado de ficha (Aprendices asignados).
 * @author Cristian Deysdayr Jiménez
 */
import { useMemo, useState } from 'react';
import { FichaDetalleAprendicesTable } from '../ficha-detalle/components/aprendices/FichaDetalleAprendicesTable';
import { FichaDetalleAprendicesToolbar } from '../ficha-detalle/components/aprendices/FichaDetalleAprendicesToolbar';
import { lmsAprendizToResponse } from './lmsAprendizToResponse';
import type { LmsAulaAprendiz } from '../../types/lms';

type Props = Readonly<{ fichaId: number; aprendices: LmsAulaAprendiz[] }>;

/**
 * Listado read-only: título, conteo, búsqueda y columnas Aprendiz / Documento / Estado.
 */
export function LmsAulaAprendices({ fichaId, aprendices }: Props) {
  const [q, setQ] = useState('');
  const mapped = useMemo(() => aprendices.map((a) => lmsAprendizToResponse(a, fichaId)), [aprendices, fichaId]);
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return mapped;
    return mapped.filter(
      (a) =>
        (a.persona_nombre || '').toLowerCase().includes(t) ||
        (a.persona_documento || '').toLowerCase().includes(t),
    );
  }, [mapped, q]);
  const ocultos = mapped.filter((a) => a.oculto_en_asistencia).length;
  const activos = mapped.length - ocultos;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-gray-800/80">
      <FichaDetalleAprendicesToolbar
        stats={{ total: activos, ocultos }}
        busqueda={q}
        onBusquedaChange={setQ}
        puedeGestionar={false}
        onAsignarClick={() => undefined}
      />
      <FichaDetalleAprendicesTable
        aprendices={filtrados}
        busquedaActiva={q.trim().length > 0}
        puedeGestionar={false}
        onOcultar={() => undefined}
        onDesasignar={() => undefined}
      />
    </div>
  );
}
