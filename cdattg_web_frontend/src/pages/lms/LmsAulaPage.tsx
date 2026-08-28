/**
 * @module pages/lms/LmsAulaPage
 * @description Aula de una ficha: pendientes, trabajos, aprendices y publicar.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeftIcon, EyeIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { useLmsAula } from './useLmsAula';
import { LmsAulaCuerpo } from './LmsAulaCuerpo';
import { LmsFichaDetalleModal } from './LmsFichaDetalleModal';
import { lmsMisPanelDesdeState, lmsVerIdDesdeState } from './lmsMisPanel';

/**
 * Página del aula. El aprendiz no ve Publicar actividad.
 */
export function LmsAulaPage() {
  const { fichaId } = useParams();
  const location = useLocation();
  const id = Number(fichaId);
  const page = useLmsAula(Number.isFinite(id) ? id : null);
  const aula = page.aula;
  const [verFicha, setVerFicha] = useState(false);
  const panelInicial = lmsMisPanelDesdeState(location.state);
  const verInicial = lmsVerIdDesdeState(location.state);

  return (
    <main className="space-y-6">
      <nav className="flex flex-wrap gap-2" aria-label="Aula">
        <Link to={lmsPaths.aulas} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver a Mis aulas
        </Link>
        {aula ? (
          <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={() => setVerFicha(true)}>
            <EyeIcon className="h-5 w-5" aria-hidden />
            Ver más
          </button>
        ) : null}
      </nav>
      {page.loading ? <p className="text-sm text-gray-500">Abriendo aula…</p> : null}
      {page.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {page.error}
        </p>
      ) : null}
      {aula ? <LmsAulaCuerpo aula={aula} page={page} panelInicial={panelInicial} verInicial={verInicial} /> : null}
      {verFicha && aula ? <LmsFichaDetalleModal fichaId={aula.ficha_id} onClose={() => setVerFicha(false)} /> : null}
    </main>
  );
}
