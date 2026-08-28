/**
 * @module pages/lms/LmsAulaAprendices
 * @description Aprendices del aula con el listado de ficha (Aprendices asignados).
 * @author Cristian Deysdayr Jiménez
 */
import { useMemo, useState } from 'react';
import { FichaDetalleAprendicesTable } from '../ficha-detalle/components/aprendices/FichaDetalleAprendicesTable';
import { FichaDetalleAprendicesToolbar } from '../ficha-detalle/components/aprendices/FichaDetalleAprendicesToolbar';
import { aprendizVisibleEnTomaAsistencia } from '../../utils/aprendizFichaPermissions';
import { lmsAprendizToResponse } from './lmsAprendizToResponse';
import type { LmsAulaAprendiz } from '../../types/lms';

type Props = Readonly<{ fichaId: number; aprendices: LmsAulaAprendiz[]; soloActivos?: boolean }>;

/**
 * Listado: el aprendiz solo ve compañeros activos; el instructor ve también ocultos.
 */
export function LmsAulaAprendices({ fichaId, aprendices, soloActivos = false }: Props) {
  const [q, setQ] = useState('');
  // El aprendiz no debe ver ocultos en inasistencia ni inactivos.
  const fuente = useMemo(() => {
    if (!soloActivos) return aprendices;
    return aprendices.filter((a) =>
      aprendizVisibleEnTomaAsistencia({ estado: a.estado ?? true, oculto_en_asistencia: a.oculto_en_asistencia }),
    );
  }, [aprendices, soloActivos]);
  const mapped = useMemo(() => fuente.map((a) => lmsAprendizToResponse(a, fichaId)), [fuente, fichaId]);
  // Busco por nombre o documento, igual que en la ficha.
  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return mapped;
    return mapped.filter(
      (a) =>
        (a.persona_nombre || '').toLowerCase().includes(t) ||
        (a.persona_documento || '').toLowerCase().includes(t),
    );
  }, [mapped, q]);
  const ocultos = soloActivos ? 0 : mapped.filter((a) => a.oculto_en_asistencia).length;
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
