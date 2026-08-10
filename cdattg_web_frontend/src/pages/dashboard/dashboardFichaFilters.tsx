import { useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type {
  AsistenciaDashboardFichaSinSesion,
  AsistenciaDashboardPorFicha,
  AsistenciaDashboardResponse,
  DashboardResumenResponse,
  RegionalItem,
  SedeItem,
} from '../../types';
import { TIPO_FORMACION_OPTIONS } from '../../constants/tipoFormacion';

export const DASH_FICHA_SEARCH_ID = 'dashboard-ficha-buscar';
export const DASH_FICHA_JORNADA_ID = 'dashboard-ficha-jornada';

export function filtrarFilasFicha<
  T extends {
    ficha_numero?: string;
    programa_nombre?: string;
    jornada_nombre?: string;
    tipo_formacion?: string;
  },
>(rows: T[], searchQuery: string, jornadaFilter: string, tipoFormacionFilter = ''): T[] {
  const q = searchQuery.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (jornadaFilter === '' || (row.jornada_nombre ?? '') === jornadaFilter) &&
      (tipoFormacionFilter === '' || (row.tipo_formacion ?? 'FORMACION_REGULAR') === tipoFormacionFilter) &&
      (q === '' ||
        row.ficha_numero?.toLowerCase().includes(q) ||
        row.programa_nombre?.toLowerCase().includes(q)),
  );
}

export function jornadaInicialDesdeApi(
  data: Pick<AsistenciaDashboardResponse | DashboardResumenResponse, 'jornadas_activas'>,
): string {
  const activas = data.jornadas_activas ?? [];
  if (activas.length === 1) return activas[0];
  return '';
}

export function useJornadasDisponibles(
  jornadasApi: string[] | undefined,
  porFicha: AsistenciaDashboardPorFicha[],
  sinSesion: AsistenciaDashboardFichaSinSesion[],
): string[] {
  return useMemo(() => {
    if (jornadasApi?.length) {
      return [...jornadasApi].sort((a, b) => a.localeCompare(b, 'es'));
    }
    const set = new Set<string>();
    porFicha.forEach((row) => {
      if (row.jornada_nombre) set.add(row.jornada_nombre);
    });
    sinSesion.forEach((row) => {
      if (row.jornada_nombre) set.add(row.jornada_nombre);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [jornadasApi, porFicha, sinSesion]);
}

export function filasPorJornada<T extends { jornada_nombre?: string }>(rows: T[], jornadaFilter: string): T[] {
  if (!jornadaFilter) return rows;
  return rows.filter((row) => (row.jornada_nombre ?? '') === jornadaFilter);
}

export type FiltrosDashboardProps = Readonly<{
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  jornadaFilter: string;
  onJornadaFilterChange: (value: string) => void;
  jornadasDisponibles: string[];
  tipoFormacion?: string;
  onTipoFormacionChange?: (value: string) => void;
  fecha?: string;
  onFechaChange?: (value: string) => void;
  regionalId?: string;
  onRegionalIdChange?: (value: string) => void;
  sedeId?: string;
  onSedeIdChange?: (value: string) => void;
  regionales?: RegionalItem[];
  sedes?: SedeItem[];
  searchId?: string;
  jornadaId?: string;
  className?: string;
}>;

export function FiltrosDashboard({
  searchQuery,
  onSearchQueryChange,
  jornadaFilter,
  onJornadaFilterChange,
  jornadasDisponibles,
  tipoFormacion = '',
  onTipoFormacionChange,
  fecha = '',
  onFechaChange,
  regionalId = '',
  onRegionalIdChange,
  sedeId = '',
  onSedeIdChange,
  regionales = [],
  sedes = [],
  searchId = DASH_FICHA_SEARCH_ID,
  jornadaId = DASH_FICHA_JORNADA_ID,
  className = '',
}: FiltrosDashboardProps) {
  const showInstitucional = onRegionalIdChange != null && onSedeIdChange != null;

  return (
    <div
      className={`grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 ${className}`.trim()}
    >
      {onFechaChange ? (
        <div>
          <label htmlFor={`${searchId}-fecha`} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Fecha de corte
          </label>
          <input
            id={`${searchId}-fecha`}
            type="date"
            value={fecha}
            onChange={(e) => onFechaChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>
      ) : null}

      <div className="sm:col-span-2 xl:col-span-2">
        <label htmlFor={searchId} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Búsqueda de ficha
        </label>
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            autoComplete="off"
            placeholder="Código de ficha o programa…"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          />
        </div>
      </div>

      {onTipoFormacionChange ? (
        <div>
          <label htmlFor={`${searchId}-tipo`} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Tipo de formación
          </label>
          <select
            id={`${searchId}-tipo`}
            value={tipoFormacion}
            onChange={(e) => onTipoFormacionChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
          >
            <option value="">Todas</option>
            {TIPO_FORMACION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div>
        <label htmlFor={jornadaId} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Jornada
        </label>
        <select
          id={jornadaId}
          value={jornadaFilter}
          onChange={(e) => onJornadaFilterChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Todas</option>
          {jornadasDisponibles.map((jornada) => (
            <option key={jornada} value={jornada}>
              {jornada}
            </option>
          ))}
        </select>
      </div>

      {showInstitucional ? (
        <>
          <div>
            <label htmlFor={`${searchId}-regional`} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Regional
            </label>
            <select
              id={`${searchId}-regional`}
              value={regionalId}
              onChange={(e) => {
                onRegionalIdChange?.(e.target.value);
                onSedeIdChange?.('');
              }}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Todas</option>
              {regionales.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${searchId}-sede`} className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Sede
            </label>
            <select
              id={`${searchId}-sede`}
              value={sedeId}
              disabled={!regionalId}
              onChange={(e) => onSedeIdChange?.(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Todas</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : null}
    </div>
  );
}

export type DashboardMetricasFiltradas = {
  enFormacion: number;
  esperados: number;
  fichasConSesion: number;
  fichasSinSesion: number;
  pctCobertura: number;
  porSede: Array<{ nombre: string; regional_nombre: string; vinieron: number; total: number; pct: number }>;
  porJornada: Array<{ nombre: string; vinieron: number; total: number; pct: number }>;
};

export function calcularMetricasDesdeResumen(
  data: DashboardResumenResponse,
  jornadaFilter: string,
): DashboardMetricasFiltradas {
  const porFicha = filasPorJornada(data.por_ficha ?? [], jornadaFilter);
  const sinSesion = filasPorJornada(data.fichas_sin_sesion ?? [], jornadaFilter);

  let vinieron = 0;
  let totalConSesion = 0;
  porFicha.forEach((row) => {
    vinieron += row.cantidad_vinieron ?? 0;
    totalConSesion += row.total_aprendices ?? 0;
  });
  const totalSinSesion = sinSesion.reduce((sum, row) => sum + (row.total_aprendices ?? 0), 0);
  const esperados = totalConSesion + totalSinSesion;
  const fichasConSesion = porFicha.length;
  const fichasSinSesion = sinSesion.length;
  const pctCobertura =
    fichasConSesion + fichasSinSesion > 0
      ? Math.round((fichasConSesion / (fichasConSesion + fichasSinSesion)) * 1000) / 10
      : 0;

  const sedeMap = new Map<string, { regional: string; vinieron: number; total: number }>();
  porFicha.forEach((row) => {
    const key = row.sede_nombre || 'Sin sede';
    const prev = sedeMap.get(key) ?? { regional: '', vinieron: 0, total: 0 };
    sedeMap.set(key, {
      regional: prev.regional,
      vinieron: prev.vinieron + (row.cantidad_vinieron ?? 0),
      total: prev.total + (row.total_aprendices ?? 0),
    });
  });
  (data.por_sede ?? []).forEach((s) => {
    const prev = sedeMap.get(s.nombre);
    if (prev && !prev.regional) {
      prev.regional = s.regional_nombre;
    }
  });

  const porSede = Array.from(sedeMap.entries()).map(([nombre, acc]) => ({
    nombre,
    regional_nombre: acc.regional,
    vinieron: acc.vinieron,
    total: acc.total,
    pct: acc.total > 0 ? Math.round((acc.vinieron / acc.total) * 1000) / 10 : 0,
  }));

  const jornadaMap = new Map<string, { vinieron: number; total: number }>();
  porFicha.forEach((row) => {
    const key = row.jornada_nombre || 'Sin jornada';
    const prev = jornadaMap.get(key) ?? { vinieron: 0, total: 0 };
    jornadaMap.set(key, {
      vinieron: prev.vinieron + (row.cantidad_vinieron ?? 0),
      total: prev.total + (row.total_aprendices ?? 0),
    });
  });
  const porJornada = Array.from(jornadaMap.entries()).map(([nombre, acc]) => ({
    nombre,
    vinieron: acc.vinieron,
    total: acc.total,
    pct: acc.total > 0 ? Math.round((acc.vinieron / acc.total) * 1000) / 10 : 0,
  }));

  let enFormacion = 0;
  porFicha.forEach((row) => {
    enFormacion += row.cantidad_en_formacion ?? 0;
  });

  return {
    enFormacion,
    esperados,
    fichasConSesion,
    fichasSinSesion,
    pctCobertura,
    porSede,
    porJornada,
  };
}
