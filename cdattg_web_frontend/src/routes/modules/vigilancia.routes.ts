import type { RouteObject } from 'react-router-dom';
import { vigilanciaPaths } from '../paths';

export const vigilanciaRoutes: RouteObject[] = [
  {
    path: vigilanciaPaths.porteria,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Portería' }],
    },
    lazy: async () => {
      const { VigilanciaPorteria } = await import('../../pages/VigilanciaPorteria');
      return { Component: VigilanciaPorteria };
    },
  },
  {
    path: vigilanciaPaths.reporte,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Reporte de accesos' }],
    },
    lazy: async () => {
      const { VigilanciaAccesoPanel } = await import('../../pages/VigilanciaAccesoPanel');
      return { Component: VigilanciaAccesoPanel };
    },
  },
  {
    path: vigilanciaPaths.ambientes,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Ambientes' }],
    },
    lazy: async () => {
      const { VigilanciaAmbientes } = await import('../../pages/VigilanciaAmbientes');
      return { Component: VigilanciaAmbientes };
    },
  },
];
