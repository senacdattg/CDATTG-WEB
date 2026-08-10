import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERFIL_PATH } from '../routes/paths';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Rutas permitidas aunque el perfil esté incompleto. */
const PERFIL_INCOMPLETO_ALLOW = new Set([PERFIL_PATH, '/login']);

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const perfilIncompleto = user?.perfil_completo === false;
  const rutaPermitida = PERFIL_INCOMPLETO_ALLOW.has(location.pathname);
  if (perfilIncompleto && !rutaPermitida) {
    return <Navigate to={PERFIL_PATH} replace state={{ from: location.pathname, perfilForzado: true }} />;
  }

  return <>{children}</>;
};
