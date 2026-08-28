/**
 * @module pages/lms/LmsAuditoriaPage
 * @description Entrada de auditoría LMS: menú y ruta /lms/auditoria.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { LmsAuditoriaFiltro } from './LmsAuditoriaFiltro';
import { useLmsAuditoria } from './useLmsAuditoria';

export function LmsAuditoriaPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { loading, error } = useLmsAuditoria(q, page);
  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Auditoría LMS</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Busque una persona o un número de ficha.</p>
        </div>
        <Link to={lmsPaths.aulas} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Mis aulas
        </Link>
      </header>
      <LmsAuditoriaFiltro
        valor={q}
        onChange={(v) => {
          setQ(v);
          setPage(1);
        }}
      />
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-gray-500">Cargando…</p> : null}
    </main>
  );
}
