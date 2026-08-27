/**
 * @module routes/modules/investigacion.public
 * @description Hijos públicos de /investigacion.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { createElement } from 'react';
import type { RouteObject } from 'react-router-dom';
import { EDITORIAL_PUBLICO } from '../../pages/portal/portalEditorialRutas';

function lista(cfgKey: keyof typeof EDITORIAL_PUBLICO): RouteObject['lazy'] {
  return async () => {
    const { PortalEditorialListaPage } = await import('../../pages/portal/PortalEditorialListaPage');
    const cfg = EDITORIAL_PUBLICO[cfgKey];
    return { Component: () => createElement(PortalEditorialListaPage, { cfg }) };
  };
}

function detalle(cfgKey: keyof typeof EDITORIAL_PUBLICO): RouteObject['lazy'] {
  return async () => {
    const { PortalEditorialDetallePage } = await import('../../pages/portal/PortalEditorialDetallePage');
    const cfg = EDITORIAL_PUBLICO[cfgKey];
    return { Component: () => createElement(PortalEditorialDetallePage, { cfg }) };
  };
}

export const investigacionPublicChildren: RouteObject[] = [
  { path: 'investigacion', lazy: async () => ({ Component: (await import('../../pages/portal/PortalInvestigacionPage')).PortalInvestigacionPage }) },
  { path: 'investigacion/presentacion', lazy: async () => ({ Component: (await import('../../pages/portal/PortalPresentacionPage')).PortalPresentacionPage }) },
  { path: 'investigacion/semilleros', lazy: async () => ({ Component: (await import('../../pages/portal/PortalSemillerosPage')).PortalSemillerosPage }) },
  { path: 'investigacion/semilleros/:slug', lazy: async () => ({ Component: (await import('../../pages/portal/PortalSemilleroDetallePage')).PortalSemilleroDetallePage }) },
  { path: 'investigacion/revista', lazy: lista('revista') },
  { path: 'investigacion/revista/:id', lazy: detalle('revista') },
  { path: 'investigacion/boletines', lazy: lista('boletines') },
  { path: 'investigacion/boletines/:id', lazy: detalle('boletines') },
  { path: 'investigacion/podcast', lazy: lista('podcast') },
  { path: 'investigacion/podcast/:id', lazy: detalle('podcast') },
  { path: 'investigacion/convocatorias', lazy: lista('convocatorias') },
  { path: 'investigacion/convocatorias/:id', lazy: detalle('convocatorias') },
  { path: 'investigacion/actividades', lazy: lista('actividades') },
  { path: 'investigacion/actividades/:id', lazy: detalle('actividades') },
];
