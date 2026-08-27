/**
 * @module pages/lms/LmsAulasListView
 * @description Mis aulas con el mismo diseño de Tomar asistencia.
 * @author Cristian Deysdayr Jiménez
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { lmsPaths } from '../../routes/paths';
import { getInicioNavigationPath } from '../../utils/roles';
import { TIPO_FORMACION_OPTIONS } from '../../constants/tipoFormacion';
import { LmsAulaCard } from './LmsAulasCards';
import { filtrarAulas, type LmsFiltroTipo } from './lmsAulasFiltro';
import type { useLmsAulas } from './useLmsAulas';

type Props = Readonly<{
  page: ReturnType<typeof useLmsAulas>;
  onVerFicha: (fichaId: number) => void;
}>;

/**
 * Vista de Mis aulas: filtro por tipo, Ver más y Entrar al aula.
 */
export function LmsAulasListView({ page, onVerFicha }: Props) {
  const { roles, permissions } = useAuth();
  const volverTo = getInicioNavigationPath(roles, permissions, lmsPaths.aulas);
  const { aulas, loading, error } = page;
  const [filtroTipo, setFiltroTipo] = useState<LmsFiltroTipo>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const visibles = useMemo(() => filtrarAulas(aulas, filtroTipo, busqueda), [aulas, filtroTipo, busqueda]);

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis aulas</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Entre al aula de cada ficha para el tablón, los trabajos de clase y los aprendices.
          </p>
        </div>
        {volverTo === lmsPaths.aulas ? null : (
          <Link to={volverTo} className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="h-5 w-5" aria-hidden />
            Volver al inicio
          </Link>
        )}
      </header>
      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-gray-500">Cargando aulas…</p> : null}
      <nav className="flex flex-wrap gap-2" aria-label="Filtro por tipo de formación">
        <FiltroChip
          activo={filtroTipo === 'TODOS'}
          onClick={() => setFiltroTipo('TODOS')}
          label={`Todas (${filtrarAulas(aulas, 'TODOS', '').length})`}
        />
        {TIPO_FORMACION_OPTIONS.map((opt) => (
          <FiltroChip
            key={opt.value}
            activo={filtroTipo === opt.value}
            onClick={() => setFiltroTipo(opt.value)}
            label={`${opt.label} (${filtrarAulas(aulas, opt.value, '').length})`}
          />
        ))}
      </nav>
      <p>
        <label htmlFor="lms-buscar-aulas" className="sr-only">
          Buscar por ficha o programa
        </label>
        <input
          id="lms-buscar-aulas"
          type="search"
          className="input-field max-w-md"
          placeholder="Buscar por ficha o programa…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </p>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibles.map((aula) => (
          <li key={aula.ficha_id}>
            <LmsAulaCard aula={aula} onVerFicha={onVerFicha} />
          </li>
        ))}
      </ul>
      {loading === false && visibles.length === 0 ? (
        <p className="text-sm text-gray-500">No hay aulas para este filtro.</p>
      ) : null}
    </main>
  );
}

/**
 * Chip de tipo de formación en Mis aulas.
 */
function FiltroChip({ activo, onClick, label }: Readonly<{ activo: boolean; onClick: () => void; label: string }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        activo
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
