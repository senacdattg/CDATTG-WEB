/**
 * @module pages/portal/PortalInvestigacionPage
 * @description Home público de Investigación: banners, semilleros y explora.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { investigacionApi } from '../../services/investigacionApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { InvestigacionHomeResponse } from '../../types/portal';
import { PortalCarousel } from './PortalCarousel';
import { PortalEmptyState } from './PortalEmptyState';
import { EXPLORA_INVESTIGACION } from './portalExplora';
import { PortalSemilleroCard } from './PortalSemilleroCard';

const vacio: InvestigacionHomeResponse = { banners: [], semilleros: [], presentacion: null };

/**
 * Entrada pública al área BIOGIGAS.
 */
export function PortalInvestigacionPage() {
  const [data, setData] = useState<InvestigacionHomeResponse>(vacio);
  const [error, setError] = useState('');

  useEffect(() => {
    investigacionApi.home()
      .then(setData)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar investigación')));
  }, []);

  return (
    <>
      <PortalCarousel banners={data.banners} />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Semilleros de investigación</h2>
            <Link to={portalPaths.semilleros} className="text-sm font-medium text-primary-700 hover:underline">Ver todos</Link>
          </div>
          {data.semilleros.length === 0 ? (
            <PortalEmptyState titulo="Aún no hay semilleros publicados" detalle="Cuando el administrador publique un grupo, aparecerá aquí." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.semilleros.map((s) => (
                <li key={s.id}><PortalSemilleroCard item={s} /></li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Explora el área de investigación</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EXPLORA_INVESTIGACION.map((e) => (
              <li key={e.to}>
                <Link to={e.to} className="block rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-sena-green hover:bg-gray-50 dark:border-gray-700">
                  {e.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
