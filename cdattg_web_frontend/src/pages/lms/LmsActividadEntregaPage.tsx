/**
 * @module pages/lms/LmsActividadEntregaPage
 * @description Lo que un aprendiz subió: archivos, nota y comentario.
 * @author Cristian Deysdayr Jiménez
 */
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { useLmsActividad } from './useLmsActividad';
import { LmsEntregaFila } from './LmsEntregaFila';
import { lmsEntregaDeAprendiz, lmsVeNotas } from './lmsActividadVista';
import { lmsVolverDesdeEntrega } from './lmsHistorialTab';

/**
 * Calificación de un envío. Vuelve a aprendices o al historial.
 */
export function LmsActividadEntregaPage() {
  const { fichaId, actividadId, aprendizId } = useParams();
  const location = useLocation();
  const fid = Number(fichaId);
  const aid = Number(actividadId);
  const apid = Number(aprendizId);
  const volver = lmsVolverDesdeEntrega(fid, aid, location.state);
  const page = useLmsActividad(Number.isFinite(fid) ? fid : null, Number.isFinite(aid) ? aid : null);
  const d = page.detalle;
  if (d && !lmsVeNotas(d)) {
    return <Navigate to={lmsPaths.actividad(fid, aid)} replace />;
  }
  const entrega = d ? lmsEntregaDeAprendiz(d.entregas, apid) : undefined;
  return (
    <main className="space-y-6">
      <Link to={volver.to} state={volver.state} className="btn-secondary inline-flex items-center gap-2">
        <ArrowLeftIcon className="h-5 w-5" aria-hidden />
        Volver
      </Link>
      {page.loading ? <p className="text-sm text-gray-500">Cargando…</p> : null}
      {page.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {page.error}
        </p>
      ) : null}
      {d && !entrega ? <p className="text-sm text-gray-500">No se encontró al aprendiz.</p> : null}
      {d && entrega ? (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{d.titulo}</h1>
          <LmsEntregaFila
            fichaId={fid}
            actividadId={d.id}
            puntos={d.calificacion_max ?? 100}
            entrega={entrega}
            saving={page.saving}
            onCalificar={page.calificar}
          />
        </>
      ) : null}
    </main>
  );
}
