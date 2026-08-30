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
import { filtrarFilasHistorial } from './lmsHistorialFiltro';
import { useLmsHistorial } from './useLmsHistorial';

type Props = Readonly<{ fichaId: number }>;

/**
 * Carga las filas, recorta por aprendiz y muestra la tabla o el aviso.
 */
export function LmsAulaHistorial({ fichaId }: Props) {
  const { filas, loading, error } = useLmsHistorial(fichaId);
  const [aprendiz, setAprendiz] = useState('');
  const visibles = useMemo(() => filtrarFilasHistorial(filas, aprendiz), [filas, aprendiz]);
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
      <LmsAulaHistorialFiltros aprendiz={aprendiz} onAprendiz={setAprendiz} />
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
