/**
 * @module routes/modules/portal
 * @description Rutas públicas del portal (sin ProtectedLayout).
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '../../components/RouteLoadingFallback';
import { portalPaths } from '../paths';
import { investigacionPublicChildren } from './investigacion.public.routes';

export const portalPublicRoutes: RouteObject = {
  path: portalPaths.index,
  hydrateFallbackElement: createElement(RouteLoadingFallback),
  lazy: async () => {
    const { PortalLayout } = await import('../../pages/portal/PortalLayout');
    return { Component: PortalLayout };
  },
  children: [
    {
      index: true,
      lazy: async () => {
        const { PortalHomePage } = await import('../../pages/portal/PortalHomePage');
        return { Component: PortalHomePage };
      },
    },
    ...investigacionPublicChildren,
  ],
};
