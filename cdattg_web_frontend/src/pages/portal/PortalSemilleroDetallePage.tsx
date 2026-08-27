/**
 * @module pages/portal/PortalSemilleroDetallePage
 * @description Ficha pública: líneas, integrantes y proyectos.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { portalApi } from '../../services/portalApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { SemilleroItem } from '../../types/portal';
import { PortalSemilleroFicha } from './PortalSemilleroFicha';

/**
 * Detalle de un semillero publicado.
 */
export function PortalSemilleroDetallePage() {
  const { slug } = useParams();
  const [item, setItem] = useState<SemilleroItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    portalApi.semilleroPublico(slug)
      .then(setItem)
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se encontró el semillero')));
  }, [slug]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Link to={portalPaths.semilleros} className="btn-secondary">Volver</Link>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      {item ? <PortalSemilleroFicha item={item} /> : null}
    </main>
  );
}
