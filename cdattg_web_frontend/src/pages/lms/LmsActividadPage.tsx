/**
 * @module pages/lms/LmsActividadPage
 * @description Vista de actividad: instrucciones, entrega o revisión.
 * @author Cristian Deysdayr Jiménez
 */
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { labelEstadoEntrega } from './lmsActividadEstado';
import { useLmsActividad } from './useLmsActividad';
import { LmsActividadAlumno } from './LmsActividadAlumno';
import { LmsActividadCabecera } from './LmsActividadCabecera';
import { lmsAulaStateVer } from './lmsMisPanel';
import { lmsMuestraEntregaAlumno } from './lmsActividadVista';

/**
 * Página de una publicación del aula.
 */
export function LmsActividadPage() {
  const { fichaId, actividadId } = useParams();
  const fid = Number(fichaId);
  const aid = Number(actividadId);
  const page = useLmsActividad(Number.isFinite(fid) ? fid : null, Number.isFinite(aid) ? aid : null);
  const d = page.detalle;
  const estado = labelEstadoEntrega(d?.mi_entrega?.entregado_en, Boolean(d?.mi_entrega?.tardia));
  if (d?.puede_publicar) {
    return <Navigate to={lmsPaths.aula(fid)} replace state={lmsAulaStateVer(aid)} />;
  }

  return (
    <main className="space-y-6">
      <nav className="flex flex-wrap items-center justify-between gap-2" aria-label="Actividad">
        <Link to={lmsPaths.aula(fid)} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver
        </Link>
        {d?.puede_publicar === false ? (
          <p className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <ClockIcon className="h-4 w-4" aria-hidden />
            {estado}
          </p>
        ) : null}
      </nav>
      {page.loading ? <p className="text-sm text-gray-500">Cargando actividad…</p> : null}
      {page.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {page.error}
        </p>
      ) : null}
      {d ? (
        <>
          <LmsActividadCabecera fichaId={fid} detalle={d} />
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Instrucciones</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
              {d.cuerpo?.trim() ? d.cuerpo : 'Ninguno'}
            </p>
          </section>
          {lmsMuestraEntregaAlumno(d.puede_publicar, d.puede_entregar) ? (
            <LmsActividadAlumno
              fichaId={fid}
              detalle={d}
              saving={page.saving}
              onEntregar={page.entregar}
              onDeshacer={page.deshacer}
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}
