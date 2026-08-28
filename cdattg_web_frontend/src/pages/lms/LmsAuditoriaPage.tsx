/**
 * @module pages/lms/LmsAuditoriaPage
 * @description Submódulo de auditoría: carpetas raíz debajo del filtro, de a 20.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { lmsPaths } from '../../routes/paths';
import { LmsAuditoriaFiltro } from './LmsAuditoriaFiltro';
import { LmsAuditoriaLista } from './LmsAuditoriaLista';
import { LmsAuditoriaPaginacion } from './LmsAuditoriaPaginacion';
import { useLmsAuditoria } from './useLmsAuditoria';

export function LmsAuditoriaPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { personas, total, loading, error } = useLmsAuditoria(q, page);
  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Auditoría LMS</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Debajo verá las carpetas raíz, de 20 en 20. El filtro recorta la lista.
          </p>
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
      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : (
        <>
          <LmsAuditoriaLista personas={personas} />
          <LmsAuditoriaPaginacion page={page} total={total} onPage={setPage} />
        </>
      )}
    </main>
  );
}
