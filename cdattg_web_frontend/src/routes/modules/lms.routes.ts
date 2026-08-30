/**
 * @module routes/modules/lms
 * @description Rutas autenticadas del LMS: aulas y auditoría.
 * @author Cristian Deysdayr Jiménez
 */
import { Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { lmsPaths } from '../paths';

export const lmsRoutes: RouteObject = {
  path: lmsPaths.index,
  Component: Outlet,
  handle: { breadcrumb: { label: 'LMS', to: lmsPaths.index } },
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
              children: [
                {
                  index: true,
                  lazy: async () => {
                    const { LmsActividadPage } = await import('../../pages/lms/LmsActividadPage');
                    return { Component: LmsActividadPage };
                  },
                },
                {
                  path: 'aprendices',
                  handle: { breadcrumb: { label: 'Aprendices' } },
                  lazy: async () => {
                    const { LmsActividadAprendicesPage } = await import(
                      '../../pages/lms/LmsActividadAprendicesPage'
                    );
                    return { Component: LmsActividadAprendicesPage };
                  },
                },
                {
                  path: 'aprendices/:aprendizId',
                  handle: { breadcrumb: { label: 'Entrega' } },
                  lazy: async () => {
                    const { LmsActividadEntregaPage } = await import('../../pages/lms/LmsActividadEntregaPage');
                    return { Component: LmsActividadEntregaPage };
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: 'auditoria',
      handle: { breadcrumb: { label: 'Auditoría', to: lmsPaths.auditoria } },
      lazy: async () => {
        const { LmsAuditoriaGuard } = await import('../../pages/lms/LmsAuditoriaGuard');
        return { Component: LmsAuditoriaGuard };
      },
      children: [
        {
          index: true,
          lazy: async () => {
            const { LmsAuditoriaPage } = await import('../../pages/lms/LmsAuditoriaPage');
            return { Component: LmsAuditoriaPage };
          },
        },
        {
          path: 'ficha/:fichaId',
          handle: { breadcrumb: { label: 'Ficha' } },
          lazy: async () => {
            const { LmsAuditoriaFichaPage } = await import('../../pages/lms/LmsAuditoriaFichaPage');
            return { Component: LmsAuditoriaFichaPage };
          },
        },
        {
          path: ':personaId',
          handle: { breadcrumb: { label: 'Carpeta' } },
          children: [
            {
              index: true,
              lazy: async () => {
                const { LmsAuditoriaPersonaPage } = await import('../../pages/lms/LmsAuditoriaPersonaPage');
                return { Component: LmsAuditoriaPersonaPage };
              },
            },
            {
              path: ':tipo',
              handle: { breadcrumb: { label: 'Tipo' } },
              lazy: async () => {
                const { LmsAuditoriaTipoPage } = await import('../../pages/lms/LmsAuditoriaTipoPage');
                return { Component: LmsAuditoriaTipoPage };
              },
            },
          ],
        },
      ],
    },
  ],
};
