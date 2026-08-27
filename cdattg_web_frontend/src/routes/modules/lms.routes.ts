/**
 * @module routes/modules/lms
 * @description Rutas autenticadas del LMS: Mis aulas y aula por ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { lmsPaths } from '../paths';

export const lmsRoutes: RouteObject = {
  path: lmsPaths.index,
  Component: Outlet,
  handle: { breadcrumb: { label: 'LMS', to: lmsPaths.aulas } },
  children: [
    {
      index: true,
      lazy: async () => {
        const { LmsIndexPage } = await import('../../pages/lms/LmsIndexPage');
        return { Component: LmsIndexPage };
      },
    },
    {
      path: 'aulas',
      handle: { breadcrumb: { label: 'Mis aulas', to: lmsPaths.aulas } },
      children: [
        {
          index: true,
          lazy: async () => {
            const { LmsAulasPage } = await import('../../pages/lms/LmsAulasPage');
            return { Component: LmsAulasPage };
          },
        },
        {
          path: ':fichaId',
          handle: { breadcrumb: { label: 'Aula' } },
          children: [
            {
              index: true,
              lazy: async () => {
                const { LmsAulaPage } = await import('../../pages/lms/LmsAulaPage');
                return { Component: LmsAulaPage };
              },
            },
            {
              path: 'actividades/:actividadId',
              handle: { breadcrumb: { label: 'Actividad' } },
              lazy: async () => {
                const { LmsActividadPage } = await import('../../pages/lms/LmsActividadPage');
                return { Component: LmsActividadPage };
              },
            },
          ],
        },
      ],
    },
  ],
};
