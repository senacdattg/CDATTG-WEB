/**
 * @module pages/portal/PortalHomePage
 * @description Inicio SENA Regional: carrusel de destacados.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { portalApi } from '../../services/portalApi';
import { portalPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { PortalBannerItem } from '../../types/portal';
import { PortalCarousel } from './PortalCarousel';

/**
 * Primera pantalla al abrir el sitio (no es el home de Investigación).
 */
export function PortalHomePage() {
  const [banners, setBanners] = useState<PortalBannerItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    portalApi.home()
      .then((h) => setBanners(h.banners ?? []))
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudo cargar el portal')));
  }, []);

  return (
    <>
      <PortalCarousel banners={banners} />
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
        <section className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Investigación BIOGIGAS</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Semilleros, revista, boletines, podcast, convocatorias y actividades del Centro.
          </p>
          <Link to={portalPaths.investigacion} className="btn-primary mt-4 inline-flex">Ir a Investigación</Link>
        </section>
      </div>
    </>
  );
}
