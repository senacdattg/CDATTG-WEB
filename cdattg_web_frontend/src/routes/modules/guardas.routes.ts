import type { RouteObject } from 'react-router-dom';
import { guardasPaths } from '../paths';

export const guardasRoutes: RouteObject[] = [
  {
    path: guardasPaths.index,
    handle: { breadcrumb: { label: 'Guardas' } },
    lazy: async () => {
      const { Guardas } = await import('../../pages/Guardas');
      return { Component: Guardas };
    },
  },
  {
    path: guardasPaths.importar,
    handle: {
      breadcrumb: [
        { label: 'Guardas', to: guardasPaths.index },
        { label: 'Importar' },
      ],
    },
    lazy: async () => {
      const { ImportarGuardas } = await import('../../pages/ImportarGuardas');
      return { Component: ImportarGuardas };
    },
  },
];