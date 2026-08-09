import { useState, useEffect, useRef, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  ChartBarIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  DocumentMagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { formatNumero } from '../utils/formatFecha';
import { useAuth } from '../context/AuthContext';
import { getAsistenciaDashboardWsUrl } from '../config/api';
import type {
  AsistenciaDashboardFichaSinSesion,
  AsistenciaDashboardPorFicha,
  AsistenciaDashboardResponse,
  RegionalItem,
  SedeItem,
} from '../types';
import { asistenciaPaths, bienestarPaths } from '../routes/paths';
import { canViewAsistenciaDashboardGlobal } from './bienestar/casos/casosBienestarPermissions';
import {
  filtrarFilasFicha,
  filasPorJornada,
  FiltrosDashboard,
  jornadaInicialDesdeApi,
  useJornadasDisponibles,
} from './dashboard/dashboardFichaFilters';
import { ReporteAsistenciaGraficos } from '../components/dashboard/ReporteAsistenciaGraficos';

const DASH_SEARCH_ID = 'asistencia-dashboard-buscar-ficha';
const DASH_JORNADA_ID = 'asistencia-dashboard-filtro-jornada';
const PAGE_SIZE = 20;
/** Último día hábil con sesiones en la BD local (para revisar el reporte en fin de semana). */
const FECHA_EJEMPLO_CON_DATOS = '2026-08-04';

function fechaHoyLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function textoResumenCasosBienestar(count: number): string {
  if (count === 0) return 'Sin aprendices que cumplan el umbral configurado (≥3 inasistencias / 30 días).';
  if (count === 1) return '1 aprendiz en umbral de riesgo por inasistencias.';
  return `${count} aprendices en umbral de riesgo por inasistencias.`;
}

function formatearJornadasActivas(jornadas: string[] | undefined): string {
  if (!jornadas?.length) return '';
  return jornadas
    .map((j) =>
      j
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    )
    .join(', ');
}

type DashboardMetricas = {
  vinieron: number;
  enFormacion: number;
  totalConSesion: number;
  totalEsperado: number;
  fichasConSesion: number;
  fichasSinSesion: number;
  jornadasTexto: string;
};

function agregarTotalesConSesion(rows: AsistenciaDashboardPorFicha[]): {
  vinieron: number;
  enFormacion: number;
  totalAprendices: number;
} {
  return rows.reduce(
    (acc, row) => ({
      vinieron: acc.vinieron + (row.cantidad_vinieron ?? 0),
      enFormacion: acc.enFormacion + (row.cantidad_en_formacion ?? 0),
      totalAprendices: acc.totalAprendices + (row.total_aprendices ?? 0),
    }),
    { vinieron: 0, enFormacion: 0, totalAprendices: 0 },
  );
}

function calcularMetricasDashboard(
  data: AsistenciaDashboardResponse,
  porFicha: AsistenciaDashboardPorFicha[],
  sinSesion: AsistenciaDashboardFichaSinSesion[],
  jornadaFilter: string,
): DashboardMetricas {
  const conSesion = filasPorJornada(porFicha, jornadaFilter);
  const sinS = filasPorJornada(sinSesion, jornadaFilter);
  const totalesConSesion = agregarTotalesConSesion(conSesion);
  const totalSinSesion = sinS.reduce((sum, row) => sum + (row.total_aprendices ?? 0), 0);

  return {
    vinieron: totalesConSesion.vinieron,
    enFormacion: totalesConSesion.enFormacion,
    totalConSesion: totalesConSesion.totalAprendices,
    totalEsperado: totalesConSesion.totalAprendices + totalSinSesion,
    fichasConSesion: conSesion.length,
    fichasSinSesion: sinS.length,
    jornadasTexto: jornadaFilter || formatearJornadasActivas(data.jornadas_disponibles),
  };
}

type PaginacionTablaProps = Readonly<{
  page: number;
  totalPages: number;
  totalFilas: number;
  setPage: Dispatch<SetStateAction<number>>;
}>;

function PaginacionTabla({ page, totalPages, totalFilas, setPage }: PaginacionTablaProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex justify-between items-center">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        Página {page} de {totalPages} ({totalFilas} total)
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="btn-secondary disabled:opacity-50"
          aria-label="Ir a la página anterior"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="btn-secondary disabled:opacity-50"
          aria-label="Ir a la página siguiente"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

type VistaReporte = 'registradas' | 'pendientes' | 'graficos';

type AsistenciaDashboardDataViewProps = Readonly<{
  data: AsistenciaDashboardResponse;
  casosBienestarCount: number | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  jornadaFilter: string;
  onJornadaFilterChange: (value: string) => void;
  jornadasDisponibles: string[];
  tipoFormacion: string;
  onTipoFormacionChange: (value: string) => void;
  regionalId: string;
  onRegionalIdChange: (value: string) => void;
  sedeId: string;
  onSedeIdChange: (value: string) => void;
  fecha: string;
  onFechaChange: (value: string) => void;
  regionales: RegionalItem[];
  sedes: SedeItem[];
  vista: VistaReporte;
  onVistaChange: (value: VistaReporte) => void;
  fichasConSesionFiltradas: AsistenciaDashboardPorFicha[];
  paginatedConSesion: AsistenciaDashboardPorFicha[];
  totalPagesConSesion: number;
  pageConSesion: number;
  setPageConSesion: Dispatch<SetStateAction<number>>;
  fichasSinSesionFiltradas: AsistenciaDashboardFichaSinSesion[];
  paginatedSinSesion: AsistenciaDashboardFichaSinSesion[];
  totalPagesSinSesion: number;
  pageSinSesion: number;
  setPageSinSesion: Dispatch<SetStateAction<number>>;
}>;

function AsistenciaDashboardDataView({
  data,
  casosBienestarCount,
  searchQuery,
  onSearchQueryChange,
  jornadaFilter,
  onJornadaFilterChange,
  jornadasDisponibles,
  tipoFormacion,
  onTipoFormacionChange,
  regionalId,
  onRegionalIdChange,
  sedeId,
  onSedeIdChange,
  fecha,
  onFechaChange,
  regionales,
  sedes,
  vista,
  onVistaChange,
  fichasConSesionFiltradas,
  paginatedConSesion,
  totalPagesConSesion,
  pageConSesion,
  setPageConSesion,
  fichasSinSesionFiltradas,
  paginatedSinSesion,
  totalPagesSinSesion,
  pageSinSesion,
  setPageSinSesion,
}: AsistenciaDashboardDataViewProps) {
  const metricas = calcularMetricasDashboard(data, data.por_ficha, data.fichas_sin_asistencia_hoy ?? [], jornadaFilter);
  const vinieron = metricas.vinieron;
  const enFormacion = metricas.enFormacion;
  const totalConSesion = metricas.totalConSesion;
  const jornadasTexto = metricas.jornadasTexto;
  const fichasConSesion = metricas.fichasConSesion;
  const fichasSinSesion = metricas.fichasSinSesion;
  const porcentajeVinieron = totalConSesion > 0 ? ((vinieron / totalConSesion) * 100).toFixed(1) : null;
  const scopeJornadaLabel = jornadaFilter || jornadasTexto || 'todas las jornadas programadas';

  const totalesConSesion = agregarTotalesConSesion(fichasConSesionFiltradas);
  const sinDatosFormacion = fichasConSesion === 0 && fichasSinSesion === 0;
  const esFechaHoy = fecha === fechaHoyLocal();

  return (
    <>
      <FiltrosDashboard
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
        jornadaFilter={jornadaFilter}
        onJornadaFilterChange={onJornadaFilterChange}
        jornadasDisponibles={jornadasDisponibles}
        tipoFormacion={tipoFormacion}
        onTipoFormacionChange={onTipoFormacionChange}
        fecha={fecha}
        onFechaChange={onFechaChange}
        regionalId={regionalId}
        onRegionalIdChange={onRegionalIdChange}
        sedeId={sedeId}
        onSedeIdChange={onSedeIdChange}
        regionales={regionales}
        sedes={sedes}
        searchId={DASH_SEARCH_ID}
        jornadaId={DASH_JORNADA_ID}
        className="mb-4"
      />

      {sinDatosFormacion && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Sin fichas con formación el {data.fecha}
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
            {esFechaHoy
              ? 'No está mal el reporte: si hoy no hay día de formación programado (p. ej. sábado/domingo/festivo), las listas y gráficos salen en cero. Cambia la fecha de corte para revisar un día hábil con datos.'
              : 'En esa fecha no hay fichas con formación según calendario, o los filtros (jornada/tipo/sede) las dejaron fuera.'}
          </p>
          {esFechaHoy && (
            <button
              type="button"
              onClick={() => onFechaChange(FECHA_EJEMPLO_CON_DATOS)}
              className="btn-primary mt-3 text-sm"
            >
              Ver {FECHA_EJEMPLO_CON_DATOS} (último día con sesiones en BD)
            </button>
          )}
        </div>
      )}

      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        <strong>Sesión registrada</strong> = el instructor abrió «Tomar asistencia» el {data.fecha} (existe registro de
        sesión). No implica que ya haya marcas de aprendices. <strong>Pendiente</strong> = ficha con formación ese día
        sin esa apertura.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha de corte</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{data.fecha}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Asistencia efectiva</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-primary-600 dark:text-primary-400">
                {totalConSesion > 0 ? (
                  <>
                    {formatNumero(vinieron)}
                    <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      {' '}
                      / {formatNumero(totalConSesion)}
                    </span>
                  </>
                ) : (
                  formatNumero(vinieron)
                )}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Aprendices con ingreso en fichas que ya abrieron sesión
                {porcentajeVinieron != null && ` (${porcentajeVinieron}%)`}
                {scopeJornadaLabel ? ` · ${scopeJornadaLabel}` : ''}
                {enFormacion !== vinieron && (
                  <> · {formatNumero(enFormacion)} aún sin salida</>
                )}
              </p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50">
              <UserGroupIcon className="h-7 w-7 text-primary-600 dark:text-primary-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con sesión registrada</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">{fichasConSesion}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Apertura de toma de asistencia ese día</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
              <ClipboardDocumentCheckIcon className="h-7 w-7 text-green-600 dark:text-green-400" aria-hidden />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes de sesión</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{fichasSinSesion}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Aún no abrieron tomar asistencia</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <ClockIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <div className="card py-3 px-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-medium">Cobertura ({scopeJornadaLabel}):</span>{' '}
          <span className="tabular-nums text-green-700 dark:text-green-400">{fichasConSesion}</span> con sesión ·{' '}
          <span className="tabular-nums text-amber-700 dark:text-amber-300">{fichasSinSesion}</span> pendientes ·{' '}
          <span className="tabular-nums text-amber-600 dark:text-amber-400">{data.pendientes_revision ?? 0}</span>{' '}
          marcaciones por revisar
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onVistaChange('registradas')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            vista === 'registradas'
              ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-200 dark:bg-primary-900/40 dark:text-primary-200'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Sesión registrada ({fichasConSesionFiltradas.length})
        </button>
        <button
          type="button"
          onClick={() => onVistaChange('pendientes')}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            vista === 'pendientes'
              ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          Pendientes de sesión ({fichasSinSesionFiltradas.length})
        </button>
        <button
          type="button"
          onClick={() => onVistaChange('graficos')}
          className={`inline-flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            vista === 'graficos'
              ? 'bg-sky-50 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-200'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
        >
          <ChartBarIcon className="h-4 w-4" aria-hidden />
          Gráficos
        </button>
      </div>

      {vista !== 'graficos' && (
      <div className="card border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <ExclamationTriangleIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Seguimiento de riesgo — Bienestar al Aprendiz
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Aprendices con ≥3 inasistencias efectivas en ventana móvil de 30 días (criterio de alerta temprana).
              </p>
              {casosBienestarCount !== null && (
                <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  {textoResumenCasosBienestar(casosBienestarCount)}
                </p>
              )}
            </div>
          </div>
          <Link
            to={bienestarPaths.casos.index}
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"
          >
            <ExclamationTriangleIcon className="h-5 w-5" aria-hidden />
            Ver módulo de casos
          </Link>
        </div>
      </div>
      )}

      {vista === 'graficos' && (
        <ReporteAsistenciaGraficos
          fecha={data.fecha}
          conSesion={fichasConSesionFiltradas}
          pendientes={fichasSinSesionFiltradas}
          scopeLabel={scopeJornadaLabel}
        />
      )}

      {vista === 'registradas' && (
      <div className="card">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          Fichas con sesión registrada
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          El instructor ya abrió la toma de asistencia el {data.fecha}. Si «Asist.» es 0, la sesión existe pero aún no
          hay marcas de aprendices
          {jornadaFilter ? ` · jornada ${jornadaFilter}` : ''}.
        </p>

        {fichasConSesionFiltradas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Ningún registro coincide con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <caption className="sr-only">Fichas con sesión de asistencia registrada</caption>
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ficha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Programa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Jornada</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Sede</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Asist. / Matrícula</th>
                  <th className="w-28 px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
                {paginatedConSesion.map((row) => (
                  <tr key={row.ficha_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {row.ficha_numero}
                      {(row.cantidad_vinieron ?? 0) === 0 ? (
                        <span className="ml-2 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                          Sin marcas
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.tipo_formacion_label || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.programa_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.jornada_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.sede_nombre || '—'}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-primary-600 dark:text-primary-400">
                      {row.cantidad_vinieron} / {row.total_aprendices ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={asistenciaPaths.historial.ficha(row.ficha_id)}
                        className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        Historial
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/50">
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total con sesión
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatNumero(totalesConSesion.vinieron)} / {formatNumero(totalesConSesion.totalAprendices)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <PaginacionTabla
          page={pageConSesion}
          totalPages={totalPagesConSesion}
          totalFilas={fichasConSesionFiltradas.length}
          setPage={setPageConSesion}
        />
      </div>
      )}

      {vista === 'pendientes' && (
      <div className="card border-amber-200 dark:border-amber-800">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          Fichas pendientes de sesión
        </h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Formación programada el {data.fecha} sin apertura de «Tomar asistencia»
          {jornadaFilter ? ` · jornada ${jornadaFilter}` : ''}.
        </p>

        {fichasSinSesionFiltradas.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            Cobertura completa en el ámbito filtrado, o sin coincidencias.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <caption className="sr-only">Fichas pendientes de apertura de sesión</caption>
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ficha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Programa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Jornada</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Sede</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Instructor</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Matrícula</th>
                  <th className="w-36 px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
                {paginatedSinSesion.map((row) => (
                  <tr key={row.ficha_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.ficha_numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.tipo_formacion_label || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.programa_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.jornada_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.sede_nombre || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.instructor_nombre ?? 'Sin asignar'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
                      {row.total_aprendices}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={asistenciaPaths.sesion(row.ficha_id)}
                        className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
                      >
                        Registrar asistencia
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginacionTabla
          page={pageSinSesion}
          totalPages={totalPagesSinSesion}
          totalFilas={fichasSinSesionFiltradas.length}
          setPage={setPageSinSesion}
        />
      </div>
      )}

      {(data.pendientes_revision ?? 0) > 0 && (
        <div className="card flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
            <DocumentMagnifyingGlassIcon className="h-7 w-7 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Marcaciones pendientes de revisión</p>
            <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {data.pendientes_revision}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export const AsistenciaDashboard = () => {
  const { token, roles } = useAuth();
  const [data, setData] = useState<AsistenciaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [casosBienestarCount, setCasosBienestarCount] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fecha, setFecha] = useState(fechaHoyLocal);
  const [jornadaFilter, setJornadaFilter] = useState('');
  const [tipoFormacion, setTipoFormacion] = useState('');
  const [regionalId, setRegionalId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [vista, setVista] = useState<VistaReporte>('registradas');
  const jornadaInicializadaRef = useRef(false);
  const [pageConSesion, setPageConSesion] = useState(1);
  const [pageSinSesion, setPageSinSesion] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canViewBienestar = canViewAsistenciaDashboardGlobal(roles);

  const handleFechaChange = useCallback((value: string) => {
    const next = value || fechaHoyLocal();
    setFecha(next);
    setJornadaFilter('');
    jornadaInicializadaRef.current = false;
    setPageConSesion(1);
    setPageSinSesion(1);
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const [res, casosRes] = await Promise.all([
        apiService.getAsistenciaDashboard({
          fecha,
          sede_id: sedeId ? Number(sedeId) : undefined,
          tipo_formacion: tipoFormacion || undefined,
          jornada: jornadaFilter || undefined,
        }),
        apiService.getCasosBienestar({ dias: 30, min_fallas: 3 }).catch(() => ({ casos: [] })),
      ]);
      setData(res);
      if (!jornadaInicializadaRef.current) {
        setJornadaFilter(jornadaInicialDesdeApi(res));
        jornadaInicializadaRef.current = true;
      }
      setCasosBienestarCount(Array.isArray(casosRes?.casos) ? casosRes.casos.length : 0);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        setError('Solo el superadministrador puede ver este dashboard.');
      } else {
        setError(axiosErrorMessage(e, 'Error al cargar el dashboard.'));
      }
    } finally {
      setLoading(false);
    }
  }, [fecha, sedeId, tipoFormacion, jornadaFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [regs, sds] = await Promise.all([
          apiService.getCatalogosRegionales(),
          apiService.getCatalogosSedes(),
        ]);
        if (!cancelled) {
          setRegionales(regs ?? []);
          setSedes(sds ?? []);
        }
      } catch {
        if (!cancelled) {
          setRegionales([]);
          setSedes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sedesFiltradas = useMemo(
    () => sedes.filter((s) => !regionalId || String(s.regional_id ?? '') === regionalId),
    [sedes, regionalId],
  );

  useEffect(() => {
    setLoading(true);
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!canViewBienestar || !token) return;

    const connect = () => {
      const url = getAsistenciaDashboardWsUrl(token);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        reconnectRef.current = setTimeout(connect, 5000);
      };
      ws.onerror = () => {
        ws.close();
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg?.type === 'refresh') fetchDashboard();
        } catch {
          // ignorar
        }
      };
    };

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [canViewBienestar, token, fetchDashboard]);

  useEffect(() => {
    setPageConSesion(1);
    setPageSinSesion(1);
  }, [searchQuery, jornadaFilter, tipoFormacion, sedeId, regionalId, vista]);

  const porFicha = data?.por_ficha ?? [];
  const sinSesion = data?.fichas_sin_asistencia_hoy ?? [];
  const jornadasDisponibles = useJornadasDisponibles(data?.jornadas_disponibles, porFicha, sinSesion);

  const fichasConSesionFiltradas = useMemo(
    () => filtrarFilasFicha(porFicha, searchQuery, '', tipoFormacion),
    [porFicha, searchQuery, tipoFormacion],
  );

  const fichasSinSesionFiltradas = useMemo(
    () => filtrarFilasFicha(sinSesion, searchQuery, '', tipoFormacion),
    [sinSesion, searchQuery, tipoFormacion],
  );

  const totalPagesConSesion = Math.ceil(fichasConSesionFiltradas.length / PAGE_SIZE);
  const totalPagesSinSesion = Math.ceil(fichasSinSesionFiltradas.length / PAGE_SIZE);

  const paginatedConSesion = useMemo(() => {
    const start = (pageConSesion - 1) * PAGE_SIZE;
    return fichasConSesionFiltradas.slice(start, start + PAGE_SIZE);
  }, [fichasConSesionFiltradas, pageConSesion]);

  const paginatedSinSesion = useMemo(() => {
    const start = (pageSinSesion - 1) * PAGE_SIZE;
    return fichasSinSesionFiltradas.slice(start, start + PAGE_SIZE);
  }, [fichasSinSesionFiltradas, pageSinSesion]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <ChartBarIcon className="h-8 w-8 text-primary-600" aria-hidden />
            Reporte de asistencia
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Cobertura del día: fichas que ya abrieron sesión vs pendientes. Filtra por tipo de formación, jornada,
            regional y sede.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <SignalIcon className="w-4 h-4" aria-hidden />
              Sincronización en tiempo real
            </span>
          )}
          <Link to={asistenciaPaths.fichas} className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-5 h-5" aria-hidden />
            Registrar asistencia
          </Link>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando…
        </div>
      )}
      {!loading && data && (
        <AsistenciaDashboardDataView
          data={data}
          casosBienestarCount={casosBienestarCount}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          jornadaFilter={jornadaFilter}
          onJornadaFilterChange={setJornadaFilter}
          jornadasDisponibles={jornadasDisponibles}
          tipoFormacion={tipoFormacion}
          onTipoFormacionChange={setTipoFormacion}
          regionalId={regionalId}
          onRegionalIdChange={setRegionalId}
          sedeId={sedeId}
          onSedeIdChange={setSedeId}
          fecha={fecha}
          onFechaChange={handleFechaChange}
          regionales={regionales}
          sedes={sedesFiltradas}
          vista={vista}
          onVistaChange={setVista}
          fichasConSesionFiltradas={fichasConSesionFiltradas}
          paginatedConSesion={paginatedConSesion}
          totalPagesConSesion={totalPagesConSesion}
          pageConSesion={pageConSesion}
          setPageConSesion={setPageConSesion}
          fichasSinSesionFiltradas={fichasSinSesionFiltradas}
          paginatedSinSesion={paginatedSinSesion}
          totalPagesSinSesion={totalPagesSinSesion}
          pageSinSesion={pageSinSesion}
          setPageSinSesion={setPageSinSesion}
        />
      )}
    </div>
  );
};
