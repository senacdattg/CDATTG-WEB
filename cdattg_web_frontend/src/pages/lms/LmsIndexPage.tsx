/**
 * @module pages/lms/LmsIndexPage
 * @description Redirige el índice LMS a Mis aulas.
 * @author Cristian Deysdayr Jiménez
 */
import { Navigate } from 'react-router-dom';
import { lmsPaths } from '../../routes/paths';

/**
 * Envía al listado de aulas.
 * @returns {JSX.Element} Redirección.
 */
export function LmsIndexPage() {
  return <Navigate to={lmsPaths.aulas} replace />;
}
