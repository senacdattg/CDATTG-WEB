/**
 * @module pages/portal/PortalCarouselSlide
 * @description Una diapositiva del carrusel (imagen, textos y botón).
 * @author CRANDEYS
 * @created 2026-08-27
 */
import { Link } from 'react-router-dom';
import { portalMediaUrl } from '../../services/portalApi';
import type { PortalBannerItem } from '../../types/portal';
import { claseCapaCarrusel, hrefCarruselSeguro } from './portalCarouselLogic';

type Props = Readonly<{ slide: PortalBannerItem; activa: boolean }>;

/**
 * Botón del slide: ruta interna o enlace https.
 */
function BotonDestacado({ href, texto }: Readonly<{ href: string; texto: string }>) {
  const clase = 'mt-5 inline-flex w-fit rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sena-green shadow hover:bg-gray-50';
  if (href.startsWith('/')) {
    return <Link to={href} className={clase}>{texto}</Link>;
  }
  return <a href={href} className={clase} target="_blank" rel="noreferrer">{texto}</a>;
}

/**
 * Capa que entra o sale con fundido cruzado.
 */
export function PortalCarouselSlide({ slide, activa }: Props) {
  const href = hrefCarruselSeguro(slide.enlace_url ?? '');
  return (
    <div className={claseCapaCarrusel(activa)} aria-hidden={!activa}>
      {slide.imagen_url ? (
        <img src={portalMediaUrl(slide.imagen_url)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-sena-green" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-4">
        <p className="w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-sena-green">
          {slide.etiqueta || 'SENA REGIONAL GUAVIARE'}
        </p>
        <h1 className="mt-4 max-w-xl text-3xl font-extrabold text-white sm:text-4xl">
          {slide.titulo || 'Formación y oportunidades'}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/90 sm:text-base">
          {slide.descripcion || 'Áreas, programas e investigación del Centro de Comercio, Industria y Turismo del Guaviare.'}
        </p>
        {slide.boton_texto && href ? <BotonDestacado href={href} texto={slide.boton_texto} /> : null}
      </div>
    </div>
  );
}
