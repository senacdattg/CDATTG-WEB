/**
 * @module pages/lms/LmsAulasCards
 * @description Tarjeta de un aula en Mis aulas (Ver más / Entrar).
 * @author Cristian Deysdayr Jiménez
 */
import { Link } from 'react-router-dom';
import { AcademicCapIcon, EyeIcon } from '@heroicons/react/24/outline';
import { FichaCaracterizacionCard } from '../../components/FichaCaracterizacionCard';
import { lmsPaths } from '../../routes/paths';
import { aulaToFichaCard } from './lmsAulaToFicha';
import type { LmsAulaListItem } from '../../types/lms';

type Props = Readonly<{ aula: LmsAulaListItem; onVerFicha: (id: number) => void }>;

/**
 * Card de ficha con acciones del aula LMS.
 */
export function LmsAulaCard({ aula, onVerFicha }: Props) {
  return (
    <FichaCaracterizacionCard
      ficha={aulaToFichaCard(aula)}
      actions={
        <nav className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end" aria-label="Acciones del aula">
          <button
            type="button"
            onClick={() => onVerFicha(aula.ficha_id)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700/50"
          >
            <EyeIcon className="h-4 w-4" />
            Ver más
          </button>
          <Link
            to={lmsPaths.aula(aula.ficha_id)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <AcademicCapIcon className="h-4 w-4" aria-hidden />
            Entrar al aula
          </Link>
        </nav>
      }
    />
  );
}
