import type { RouteObject } from 'react-router-dom';
import { fichasPaths } from '../paths';

const lazyFichasList = async () => {
  const { FichasCaracterizacion } = await import('../../pages/FichasCaracterizacion');
  return { Component: FichasCaracterizacion };
};

const lazyFichaDetalle = async () => {
  const { FichaDetalle } = await import('../../pages/FichaDetalle');
  return { Component: FichaDetalle };
};

function detalleBreadcrumb(listLabel: string, listPath: string) {
  return (params: Record<string, string | undefined>) => [
    { label: listLabel, to: listPath },
    { label: params.fichaId ? `Ficha ${params.fichaId}` : 'Ficha' },
  ];
}

export const fichasRoutes: RouteObject[] = [
  {
    path: fichasPaths.index,
    handle: { breadcrumb: { label: 'Formación Regular' } },
    lazy: lazyFichasList,
  },
  {
    path: fichasPaths.mediaTecnica,
    handle: { breadcrumb: { label: 'Media Técnica' } },
    lazy: lazyFichasList,
  },
  {
    path: `${fichasPaths.mediaTecnica}/:fichaId`,
    handle: {
      breadcrumb: detalleBreadcrumb('Media Técnica', fichasPaths.mediaTecnica),
    },
    lazy: lazyFichaDetalle,
  },
  {
    path: `${fichasPaths.index}/:fichaId`,
    handle: {
      breadcrumb: detalleBreadcrumb('Formación Regular', fichasPaths.index),
    },
    lazy: lazyFichaDetalle,
  },
];
