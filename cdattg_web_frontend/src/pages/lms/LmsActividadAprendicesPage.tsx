/**
 * @module pages/lms/LmsActividadAprendicesPage
 * @description Ver más: todos los aprendices de la actividad.
 * @author Cristian Deysdayr Jiménez
 */
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { useLmsActividad } from './useLmsActividad';
import { LmsActividadInstructor } from './LmsActividadInstructor';

/**
 * Lista de la ficha. De aquí se entra a lo que cada uno subió.
 */
export function LmsActividadAprendicesPage() {
  const { fichaId, actividadId } = useParams();
  const fid = Number(fichaId);
  const aid = Number(actividadId);
  const page = useLmsActividad(Number.isFinite(fid) ? fid : null, Number.isFinite(aid) ? aid : null);
  const d = page.detalle;
  if (d && !d.puede_publicar) {
    return <Navigate to={lmsPaths.actividad(fid, aid)} replace />;
  }
  return (
    <main className="space-y-6">
      <Link to={lmsPaths.aula(fid)} className="btn-secondary inline-flex items-center gap-2">
        <ArrowLeftIcon className="h-5 w-5" aria-hidden />
        Volver
      </Link>
      {page.loading ? <p className="text-sm text-gray-500">Cargando…</p> : null}
      {page.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {page.error}
        </p>
      ) : null}
      {d ? (
        <>
          <header>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{d.titulo}</h1>
            <p className="mt-1 text-sm text-gray-500">Aprendices de la actividad. Abra Ver actividad para calificar.</p>
          </header>
          <LmsActividadInstructor fichaId={fid} detalle={d} />
        </>
      ) : null}
    </main>
  );
}
