import { Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { complementariosPaths } from '../paths';

export const complementariosRoutes: RouteObject = {
  path: complementariosPaths.index,
  Component: Outlet,
  handle: { breadcrumb: { label: 'Complementarios', to: complementariosPaths.index } },
  children: [
    {
      index: true,
      handle: { breadcrumb: { label: 'Verificación de aspirantes' } },
      lazy: async () => {
        const { ComplementariosVerificacionPage } = await import(
          '../../pages/complementarios/ComplementariosVerificacionPage'
        );
        return { Component: ComplementariosVerificacionPage };
      },
    },
    {
      path: 'verificacion',
      handle: { breadcrumb: { label: 'Verificación de aspirantes' } },
      lazy: async () => {
        const { ComplementariosVerificacionPage } = await import(
          '../../pages/complementarios/ComplementariosVerificacionPage'
        );
        return { Component: ComplementariosVerificacionPage };
      },
    },
    {
      path: 'betowa',
      handle: { breadcrumb: { label: 'Verificación Betowa' } },
      lazy: async () => {
        const { ComplementariosBetowaVerificacionPage } = await import(
          '../../pages/complementarios/ComplementariosBetowaVerificacionPage'
        );
        return { Component: ComplementariosBetowaVerificacionPage };
      },
    },
  ],
};
