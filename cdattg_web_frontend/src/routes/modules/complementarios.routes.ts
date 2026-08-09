import { createElement } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { complementariosPaths } from '../paths';

export const complementariosRoutes: RouteObject = {
  path: complementariosPaths.index,
  Component: Outlet,
  handle: { breadcrumb: { label: 'Complementarios' } },
  children: [
    {
      index: true,
      element: createElement(Navigate, { to: complementariosPaths.consultarRegistro, replace: true }),
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
    {
      path: 'consultar-registro',
      handle: { breadcrumb: { label: 'Fase 1 · Consultar Registro' } },
      lazy: async () => {
        const { ComplementariosConsultarRegistroPage } = await import(
          '../../pages/complementarios/ComplementariosConsultarRegistroPage'
        );
        return { Component: ComplementariosConsultarRegistroPage };
      },
    },
    {
      path: 'inscripciones',
      handle: { breadcrumb: { label: 'Fase 2 · Programas de formación' } },
      lazy: async () => {
        const { ComplementariosInscripcionesPage } = await import(
          '../../pages/complementarios/ComplementariosInscripcionesPage'
        );
        return { Component: ComplementariosInscripcionesPage };
      },
    },
  ],
};
