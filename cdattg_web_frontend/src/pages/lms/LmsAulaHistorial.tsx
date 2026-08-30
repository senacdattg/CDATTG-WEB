/**
 * @module pages/lms/LmsAulaHistorial
 * @description Historial de calificaciones del aula.
 * Lo hice para ver a todos los aprendices y lo que sacaron.
 * Lo abre la pestaña Historial de actividades.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsAulaHistorialTabla } from './LmsAulaHistorialTabla';
import { useLmsHistorial } from './useLmsHistorial';

type Props = Readonly<{ fichaId: number }>;

/**
 * Carga las filas y muestra la tabla o el aviso.
 */
export function LmsAulaHistorial({ fichaId }: Props) {
  const { filas, loading, error } = useLmsHistorial(fichaId);
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
  return <LmsAulaHistorialTabla fichaId={fichaId} filas={filas} />;
}
