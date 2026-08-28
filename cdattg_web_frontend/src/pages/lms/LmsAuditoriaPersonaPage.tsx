/**
 * @module pages/lms/LmsAuditoriaPersonaPage
 * @description Las tres carpetas de tipo de formación de una persona.
 * @author Cristian Deysdayr Jiménez
 */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { LmsAuditoriaCarpeta } from './LmsAuditoriaCarpeta';
import { useLmsAuditoriaPersona } from './useLmsAuditoriaPersona';

/**
 * Tras Ver más: Regular, Media Técnica y Complementaria.
 */
export function LmsAuditoriaPersonaPage() {
  const personaId = Number(useParams().personaId);
  const { det, error } = useLmsAuditoriaPersona(personaId);
  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {det?.nombre_carpeta ?? 'Carpeta'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Regular, media técnica y complementaria se crean al registrar a la persona.
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
      <ul className="grid gap-4 md:grid-cols-3">
        {(det?.tipos ?? []).map((t) => (
          <li key={t.tipo}>
            <LmsAuditoriaCarpeta
              titulo={t.nombre_carpeta}
              detalle={`${t.cantidad_fichas} ficha(s)`}
              to={lmsPaths.auditoriaTipo(personaId, t.tipo)}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
