import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, CalendarDaysIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { useAuth } from '../context/AuthContext';
import { LABEL_INSTRUCTOR_LIDER } from '../constants/instructorLiderLabels';
import {
  TIPO_FORMACION_OPTIONS,
  labelTipoFormacion,
  type TipoFormacion,
} from '../constants/tipoFormacion';
import { FichaCaracterizacionCard } from '../components/FichaCaracterizacionCard';
import type { FichaCaracterizacionResponse } from '../types';
import { tituloProgramaFicha } from '../utils/fichaListDisplay';
import { asistenciaHistorialFichaPath, asistenciaPaths } from './asistencia/asistenciaPaths';

const HISTORIAL_SEARCH_ID = 'asistencia-historial-buscar-ficha';

type FiltroTipoHistorial = 'TODOS' | TipoFormacion;

type HistorialFichasTableProps = Readonly<{ rows: FichaCaracterizacionResponse[] }>;

function HistorialFichasTable({ rows }: HistorialFichasTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <caption className="sr-only">Listado de fichas para consultar historial de asistencia</caption>
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Ficha
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Programa / nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                {LABEL_INSTRUCTOR_LIDER}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Jornada
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Sede / Ambiente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Aprendices
              </th>
              <th className="w-40 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
            {rows.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.ficha}</td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {tituloProgramaFicha(item) || '–'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {labelTipoFormacion(item.tipo_formacion)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.instructor_nombre || '–'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.jornada_nombre || '–'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {[item.sede_nombre, item.ambiente_nombre].filter(Boolean).join(' / ') || '–'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.cantidad_aprendices}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={asistenciaHistorialFichaPath(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    <CalendarDaysIcon className="h-4 w-4" aria-hidden />
                    Ver historial
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type HistorialFichasCardsProps = Readonly<{ rows: FichaCaracterizacionResponse[] }>;

function HistorialFichasCards({ rows }: HistorialFichasCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((item) => (
        <FichaCaracterizacionCard
          key={item.id}
          ficha={item}
          actions={
            <Link
              to={asistenciaHistorialFichaPath(item.id)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <CalendarDaysIcon className="h-4 w-4" aria-hidden />
              Ver historial
            </Link>
          }
        />
      ))}
    </div>
  );
}

export const AsistenciaHistorial = () => {
  const { roles } = useAuth();
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoHistorial>('TODOS');

  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  const loadFichas = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tipoParam = filtroTipo === 'TODOS' ? undefined : filtroTipo;
      const res = await apiService.getFichasCaracterizacion(
        1,
        500,
        undefined,
        isSuperAdmin ? undefined : true,
        undefined,
        tipoParam,
      );
      setFichas(res.data);
    } catch (e: unknown) {
      setFichas([]);
      setError(axiosErrorMessage(e, 'No se pudo cargar el listado de fichas.'));
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, filtroTipo]);

  useEffect(() => {
    loadFichas();
  }, [loadFichas]);

  const fichasFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return fichas;
    return fichas.filter(
      (ficha) =>
        ficha.ficha.toLowerCase().includes(q) ||
        tituloProgramaFicha(ficha).toLowerCase().includes(q) ||
        labelTipoFormacion(ficha.tipo_formacion).toLowerCase().includes(q),
    );
  }, [fichas, searchQuery]);

  const hayResultados = fichasFiltradas.length > 0;
  const vacioTrasFiltro = !loading && hayResultados === false;
  const mensajeVacio = (() => {
    if (!isSuperAdmin && fichas.length === 0 && filtroTipo === 'TODOS' && !searchQuery.trim()) {
      return 'No tiene fichas asignadas como instructor. Solo puede ver el historial de las fichas en las que está asignado.';
    }
    if (filtroTipo !== 'TODOS' || searchQuery.trim()) {
      return 'No hay fichas que coincidan con los filtros seleccionados.';
    }
    return 'No hay fichas registradas.';
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historial de asistencias</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isSuperAdmin
              ? 'Consulte el historial de asistencia de cualquier ficha. Seleccione una ficha para ver detalle por fecha.'
              : 'Consulte por fecha qué aprendices asistieron o no a cada ficha. Solo puede ver el historial de las fichas en las que está asignado.'}
          </p>
        </div>
        <Link to={asistenciaPaths.fichas} className="btn-secondary inline-flex items-center gap-2">
          <ClipboardDocumentListIcon className="h-5 w-5" aria-hidden />
          Tomar asistencia
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {!loading && (
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
          <div className="min-w-[220px] max-w-xl">
            <label
              htmlFor={HISTORIAL_SEARCH_ID}
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Buscar ficha
            </label>
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                id={HISTORIAL_SEARCH_ID}
                type="search"
                autoComplete="off"
                placeholder="Código de ficha o programa…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de formación</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  filtroTipo === 'TODOS'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setFiltroTipo('TODOS')}
              >
                Todas
              </button>
              {TIPO_FORMACION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    filtroTipo === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setFiltroTipo(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando fichas…
        </div>
      )}

      {vacioTrasFiltro && (
        <div className="card py-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">{mensajeVacio}</p>
          {(filtroTipo !== 'TODOS' || searchQuery.trim()) && (
            <button
              type="button"
              className="btn-secondary mt-4 inline-flex"
              onClick={() => {
                setFiltroTipo('TODOS');
                setSearchQuery('');
              }}
            >
              Limpiar filtros
            </button>
          )}
          {filtroTipo === 'TODOS' && !searchQuery.trim() && (
            <Link to={asistenciaPaths.fichas} className="btn-primary mt-4 inline-flex">
              Ir a tomar asistencia
            </Link>
          )}
        </div>
      )}

      {!loading && hayResultados && isSuperAdmin && <HistorialFichasTable rows={fichasFiltradas} />}

      {!loading && hayResultados && !isSuperAdmin && <HistorialFichasCards rows={fichasFiltradas} />}
    </div>
  );
};
