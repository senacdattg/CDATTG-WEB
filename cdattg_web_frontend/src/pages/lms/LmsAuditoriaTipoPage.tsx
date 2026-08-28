/**
 * @module pages/lms/LmsAuditoriaTipoPage
 * @description Entregas del aprendiz dentro de un tipo de formación.
 * @author Cristian Deysdayr Jiménez
 */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { LmsAuditoriaFichaBloque } from './LmsAuditoriaFichaBloque';
import { useLmsAuditoriaTipo } from './useLmsAuditoriaTipo';

/**
 * Lista fichas y los archivos que el aprendiz cargó.
 */
export function LmsAuditoriaTipoPage() {
  const { personaId, tipo } = useParams();
  const pid = Number(personaId);
  const { det, error } = useLmsAuditoriaTipo(pid, tipo ?? '');
  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {det?.nombre_carpeta ?? 'Tipo de formación'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Actividades que cargó el aprendiz en este tipo.</p>
        </div>
        <Link to={lmsPaths.auditoriaPersona(pid)} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver
        </Link>
      </header>
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </p>
      ) : null}
      {(det?.fichas ?? []).length === 0 ? (
        <p className="text-sm text-gray-500">No hay fichas en esta carpeta.</p>
      ) : (
        <div className="space-y-4">
          {(det?.fichas ?? []).map((f) => (
            <LmsAuditoriaFichaBloque key={f.ficha_id} ficha={f} />
          ))}
        </div>
      )}
    </main>
  );
}
