/**
 * @module pages/portal/PortalCarousel
 * @description Carrusel con fundido cruzado (inicio SENA e Investigación).
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import type { PortalBannerItem } from '../../types/portal';
import { CARRUSEL_INTERVALO_MS, siguienteIndiceCarrusel } from './portalCarouselLogic';
import { PortalCarouselSlide } from './PortalCarouselSlide';

type Props = Readonly<{ banners: PortalBannerItem[] }>;

const FALLBACK: PortalBannerItem = {
  id: 0,
  titulo: '',
  descripcion: '',
  imagen_url: '',
  etiqueta: '',
  boton_texto: '',
  enlace_url: '',
  orden: 0,
  estado_publicacion: 'publicado',
};

/**
 * Rotación automática: las capas se cruzan en opacidad (700 ms).
 */
export function PortalCarousel({ banners }: Props) {
  const slides = banners.filter((b) => b.imagen_url || b.titulo);
  const capas = slides.length > 0 ? slides : [FALLBACK];
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (capas.length < 2) return undefined;
    const id = globalThis.setInterval(() => {
      setIndice((n) => siguienteIndiceCarrusel(n, capas.length));
    }, CARRUSEL_INTERVALO_MS);
    return () => globalThis.clearInterval(id);
  }, [capas.length]);

  return (
    <section className="relative h-64 overflow-hidden bg-sena-green sm:h-80 lg:h-96" aria-roledescription="carrusel" aria-label="Carrusel">
      {capas.map((slide, i) => (
        <PortalCarouselSlide key={slide.id || i} slide={slide} activa={i === indice} />
      ))}
      {capas.length > 1 ? (
        <ol className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {capas.map((s, i) => (
            <li key={`dot-${s.id || i}`}>
              <button type="button" aria-label={`Diapositiva ${i + 1}`} className={`h-2.5 w-2.5 rounded-full ${i === indice ? 'bg-white' : 'bg-white/50'}`} onClick={() => setIndice(i)} />
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
