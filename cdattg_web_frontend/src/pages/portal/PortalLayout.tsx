/**
 * @module pages/portal/PortalLayout
 * @description Cabecera pública (entrada del sitio, sin sidebar).
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  HomeIcon,
  BeakerIcon,
  ArrowRightEndOnRectangleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import LogoSena from '../../../logo-sena-verde-complementario-svg-2022.svg';
import { useAuth } from '../../context/AuthContext';
import { portalPaths, registroPath } from '../../routes/paths';
import { getHomeRouteForUser } from '../../utils/roles';

function claseNav({ isActive }: { isActive: boolean }): string {
  return `inline-flex items-center gap-1.5 text-sm ${
    isActive ? 'font-semibold text-sena-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
  }`;
}

/**
 * Shell: marca SENA, investigación, login y registro.
 */
export function PortalLayout() {
  const { isAuthenticated, roles, permissions } = useAuth();
  return (
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to={portalPaths.index} className="flex items-center gap-2">
            <img src={LogoSena} alt="SENA" className="h-9 w-9" />
            <span className="text-sm font-semibold text-gray-800 dark:text-white sm:text-base">
              SENA Regional Guaviare
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-5" aria-label="Portal">
            <NavLink to={portalPaths.index} end className={claseNav}>
              <HomeIcon className="h-4 w-4" /> Inicio
            </NavLink>
            <NavLink to={portalPaths.investigacion} className={claseNav}>
              <BeakerIcon className="h-4 w-4" /> Investigación
            </NavLink>
          </nav>
          <nav className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            {isAuthenticated ? (
              <Link to={getHomeRouteForUser(roles, permissions)} className="hover:text-gray-900 dark:hover:text-white">
                Ir al sistema
              </Link>
            ) : (
              <>
                <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white">
                  <ArrowRightEndOnRectangleIcon className="h-4 w-4" /> Iniciar Sesión
                </Link>
                <Link to={registroPath} className="inline-flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white">
                  <UserPlusIcon className="h-4 w-4" /> Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
