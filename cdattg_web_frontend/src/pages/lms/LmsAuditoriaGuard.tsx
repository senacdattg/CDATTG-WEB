/**
 * @module pages/lms/LmsAuditoriaGuard
 * @description Cierra la puerta de auditoría si no es superadministrador.
 * Lo pongo en las rutas de /lms/auditoria.
 * @author Cristian Deysdayr Jiménez
 */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { lmsPaths } from '../../routes/paths';
import { lmsPuedeAuditar } from './lmsAuditoriaRol';

/**
 * Deja pasar solo al superadministrador. Si no, lo mando a Mis aulas.
 * @returns {JSX.Element} Las páginas de auditoría o la redirección.
 */
export function LmsAuditoriaGuard() {
  const { roles } = useAuth();
  if (!lmsPuedeAuditar(roles)) {
    return <Navigate to={lmsPaths.aulas} replace />;
  }
  return <Outlet />;
}
