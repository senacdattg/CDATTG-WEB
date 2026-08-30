/**
 * @module pages/lms/LmsAulaHistorial
 * @description Historial de calificaciones del aula.
 * Lo hice para ver a todos los aprendices y lo que sacaron.
 * Lo abre la pestaña Historial de actividades.
 * @author Cristian Deysdayr Jiménez
 */
import { useMemo, useState } from 'react';
import { LmsAulaHistorialFiltros } from './LmsAulaHistorialFiltros';
import { LmsAulaHistorialTabla } from './LmsAulaHistorialTabla';
import { filtrarFilasHistorial, type LmsHistorialEstadoFiltro } from './lmsHistorialFiltro';
import { columnasHistorial } from './lmsHistorialMatriz';
import { useLmsHistorial } from './useLmsHistorial';

type Props = Readonly<{ fichaId: number }>;

/**
 * Carga las filas, recorta y muestra la tabla o el aviso.
 */
export function LmsAulaHistorial({ fichaId }: Props) {
  const { filas, loading, error } = useLmsHistorial(fichaId);
  // Recorto por nombre, título y si está oculto en asistencia.
  const [aprendiz, setAprendiz] = useState('');
  const [actividadId, setActividadId] = useState<number | null>(null);
  const [estado, setEstado] = useState<LmsHistorialEstadoFiltro>('todos');
  // La lista cambia por instructor: solo salen las actividades de sus filas.
  const actividades = useMemo(() => columnasHistorial(filas), [filas]);
  const visibles = useMemo(
    () => filtrarFilasHistorial(filas, { aprendiz, actividadId, estado }),
    [filas, aprendiz, actividadId, estado],
  );
  if (loading) {
    return <p className="text-sm text-gray-500">Cargando historial…</p>;
  }
  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {error}
      </p>
    );
  }
  if (filas.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        Aún no hay aprendices o actividades para mostrar.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <LmsAulaHistorialFiltros
        aprendiz={aprendiz}
        actividadId={actividadId}
        actividades={actividades}
        estado={estado}
        onAprendiz={setAprendiz}
        onActividad={setActividadId}
        onEstado={setEstado}
      />
      {visibles.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
          Ningún resultado con estos filtros.
        </p>
      ) : (
        <LmsAulaHistorialTabla fichaId={fichaId} filas={visibles} />
      )}
    </div>
  );
}
