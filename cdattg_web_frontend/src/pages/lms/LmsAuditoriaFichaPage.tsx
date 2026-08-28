/**
 * @module pages/lms/LmsAuditoriaFichaPage
 * @description Carpetas raíz de las personas de una ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { LmsAuditoriaLista } from './LmsAuditoriaLista';
import { useLmsAuditoriaFicha } from './useLmsAuditoriaFicha';

/**
 * Tras Auditar: cada persona es una carpeta. Ver más abre Regular / Media / Complementaria.
 */
export function LmsAuditoriaFichaPage() {
  const fichaId = Number(useParams().fichaId);
  const { personas, error } = useLmsAuditoriaFicha(fichaId);
  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Carpetas de la ficha</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Abra Ver más para revisar entregas, la nota y el comentario del instructor.
          </p>
        </div>
        <Link to={lmsPaths.auditoria} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver
        </Link>
      </header>
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </p>
      ) : null}
      <LmsAuditoriaLista personas={personas} />
    </main>
  );
}
