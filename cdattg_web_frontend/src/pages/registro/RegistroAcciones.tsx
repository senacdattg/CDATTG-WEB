/**
 * @module pages/registro/RegistroAcciones
 * @description Siguiente visible, Atrás sutil y envío en el último paso.
 * @author Cristian Deysdayr Jiménez
 */
import { ArrowRightIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { portalPaths } from '../../routes/paths';
import { TOTAL_PASOS } from './registroForm';

const POLITICA_SENA = 'https://www.sena.edu.co/es-co/transparencia/Paginas/politicas-lineamientos.aspx';

type Props = Readonly<{
  paso: number;
  saving: boolean;
  onAtras: () => void;
}>;

/**
 * Acciones del paso: avanzar, volver o registrar.
 */
export function RegistroAcciones({ paso, saving, onAtras }: Props) {
  const ultimo = paso >= TOTAL_PASOS - 1;
  return (
    <div className="space-y-4">
      <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 py-3" disabled={saving}>
        {ultimo ? <UserPlusIcon className="h-5 w-5" aria-hidden /> : <ArrowRightIcon className="h-5 w-5" aria-hidden />}
        {labelPrincipal(ultimo, saving)}
      </button>
      {paso > 0 ? (
        <button type="button" onClick={onAtras} className="w-full text-center text-sm text-gray-600 hover:underline dark:text-gray-400">
          Atrás
        </button>
      ) : (
        <Link to={portalPaths.index} className="block w-full text-center text-sm text-gray-600 hover:underline dark:text-gray-400">
          Volver al inicio
        </Link>
      )}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        Sus datos se tratan conforme a la{' '}
        <a className="text-primary-700 underline dark:text-primary-300" href={POLITICA_SENA} target="_blank" rel="noopener noreferrer">
          política de privacidad del SENA
        </a>
        .
      </p>
      <p className="text-center text-sm">
        <Link to="/login" className="text-primary-700 hover:underline dark:text-primary-300">Ya tengo cuenta</Link>
      </p>
    </div>
  );
}

function labelPrincipal(ultimo: boolean, saving: boolean): string {
  if (saving) return 'Registrando…';
  return ultimo ? 'Registrarme ahora' : 'Siguiente';
}
