import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type {
  AccesoEstadisticasResponse,
  AccesoHistorialItem,
  AccesoHistorialParams,
  AccesoHistorialResponse,
  RegionalItem,
  SedeItem,
} from '../types';

const TIPO_LABELS: Record<string, string> = {
  APRENDIZ: 'Aprendiz',
  INSTRUCTOR: 'Instructor',
  ADMINISTRATIVO: 'Administrativo',
  VISITANTE: 'Visitante',
};

const MOTIVO_LABELS: Record<string, string> = {
  DESCANSO: 'Descanso',
  CAFETERIA: 'Cafetería',
  FIN_JORNADA: 'Fin de jornada',
  CITA_MEDICA: 'Cita médica',
  NOVEDAD_FAMILIAR: 'Novedad familiar',
  COMISION_INSTITUCIONAL: 'Comisión institucional',
  OTRO: 'Otro',
};

function hoyISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function haceDiasISO(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatHora(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function kpiToneClass(tone?: string): string {
  switch (tone) {
    case 'emerald':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100';
    case 'amber':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100';
    case 'red':
      return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100';
    default:
      return 'border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white';
  }
}

function KpiCard({ label, value, tone }: Readonly<{ label: string; value: number | string; tone?: string }>) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${kpiToneClass(tone)}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function DistList({ title, data, labels }: Readonly<{ title: string; data?: Record<string, number>; labels?: Record<string, string> }>) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Sin datos</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {entries.map(([k, n]) => (
            <li key={k} className="flex justify-between gap-2">
              <span className="text-gray-700 dark:text-gray-300">{labels?.[k] || k || '—'}</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function VigilanciaAccesoPanel() {
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [regionalId, setRegionalId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [fechaDesde, setFechaDesde] = useState(haceDiasISO(7));
  const [fechaHasta, setFechaHasta] = useState(hoyISO());
  const [tipoPersona, setTipoPersona] = useState('');
  const [documento, setDocumento] = useState('');
  const [estado, setEstado] = useState('todos');
  const [soloSinIngreso, setSoloSinIngreso] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historial, setHistorial] = useState<AccesoHistorialResponse | null>(null);
  const [stats, setStats] = useState<AccesoEstadisticasResponse | null>(null);

  const sedesFiltradas = useMemo(
    () => sedes.filter((s) => !regionalId || String(s.regional_id ?? '') === regionalId),
    [sedes, regionalId],
  );

  useEffect(() => {
    Promise.all([apiService.getCatalogosRegionales(), apiService.getCatalogosSedes()])
      .then(([regs, seds]) => {
        setRegionales(regs ?? []);
        setSedes(seds ?? []);
      })
      .catch((e: unknown) => setError(axiosErrorMessage(e, 'No se pudieron cargar catálogos.')));
  }, []);

  const buildParams = useCallback(
    (pageOverride?: number): AccesoHistorialParams => {
      const params: AccesoHistorialParams = {
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        tipo_persona: tipoPersona || undefined,
        documento: documento.trim() || undefined,
        estado: estado === 'todos' ? undefined : estado,
        page: pageOverride ?? page,
        page_size: 25,
      };
      if (regionalId) params.regional_id = Number(regionalId);
      if (sedeId) params.sede_id = Number(sedeId);
      if (soloSinIngreso) params.salida_sin_ingreso = true;
      return params;
    },
    [fechaDesde, fechaHasta, tipoPersona, documento, estado, page, regionalId, sedeId, soloSinIngreso],
  );

  const cargar = useCallback(
    async (pageOverride?: number) => {
      setLoading(true);
      setError('');
      const params = buildParams(pageOverride);
      try {
        const [hist, est] = await Promise.all([
          apiService.accesoHistorial(params),
          apiService.accesoEstadisticas(params),
        ]);
        setHistorial(hist);
        setStats(est);
        if (pageOverride) setPage(pageOverride);
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'No se pudo cargar el reporte.'));
      } finally {
        setLoading(false);
      }
    },
    [buildParams],
  );

  useEffect(() => {
    void cargar(1);
    // carga inicial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = historial ? Math.max(1, Math.ceil(historial.total / historial.page_size)) : 1;

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-8">
      <header>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-7 w-7 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Reporte de accesos</h1>
        </div>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Historial de ingresos/salidas, filtros y estadísticas por sede o regional.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Filtros</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="rep-regional" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Regional
            </label>
            <select
              id="rep-regional"
              className="input-field w-full"
              value={regionalId}
              onChange={(e) => {
                setRegionalId(e.target.value);
                setSedeId('');
              }}
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
            <label htmlFor="rep-sede" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sede
            </label>
            <select
              id="rep-sede"
              className="input-field w-full"
              value={sedeId}
              onChange={(e) => setSedeId(e.target.value)}
            >
              <option value="">Todas</option>
              {sedesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-desde" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Desde
            </label>
            <input
              id="rep-desde"
              type="date"
              className="input-field w-full"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rep-hasta" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hasta
            </label>
            <input
              id="rep-hasta"
              type="date"
              className="input-field w-full"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="rep-tipo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo persona
            </label>
            <select
              id="rep-tipo"
              className="input-field w-full"
              value={tipoPersona}
              onChange={(e) => setTipoPersona(e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rep-estado" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Estado
            </label>
            <select
              id="rep-estado"
              className="input-field w-full"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="abierto">Dentro (abierto)</option>
              <option value="cerrado">Cerrados (con salida)</option>
            </select>
          </div>
          <div>
            <label htmlFor="rep-doc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Documento
            </label>
            <input
              id="rep-doc"
              type="text"
              className="input-field w-full"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Buscar documento"
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={soloSinIngreso}
                onChange={(e) => setSoloSinIngreso(e.target.checked)}
              />{' '}
              Solo salidas sin ingreso
            </label>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            disabled={loading}
            onClick={() => void cargar(1)}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {loading ? 'Cargando…' : 'Consultar'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={() => {
              setFechaDesde(hoyISO());
              setFechaHasta(hoyISO());
              setTimeout(() => void cargar(1), 0);
            }}
          >
            Solo hoy
          </button>
        </div>
      </section>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {stats ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Ingresos (periodo)" value={stats.total_ingresos} tone="emerald" />
          <KpiCard label="Salidas (periodo)" value={stats.total_salidas} tone="amber" />
          <KpiCard label="Dentro ahora" value={stats.dentro_ahora} />
          <KpiCard label="Salidas sin ingreso" value={stats.salidas_sin_ingreso} tone="red" />
        </section>
      ) : null}

      {stats ? (
        <section className="grid gap-3 lg:grid-cols-3">
          <DistList title="Por tipo de persona" data={stats.por_tipo_persona} labels={TIPO_LABELS} />
          <DistList title="Por motivo de salida" data={stats.por_motivo_salida} labels={MOTIVO_LABELS} />
          <DistList title="Por método" data={stats.por_metodo} />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial {historial ? `(${historial.total})` : ''}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Documento</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Sede</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Entrada</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Salida</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Motivo</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(historial?.items || []).map((item: AccesoHistorialItem) => (
                <tr key={item.visita_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {item.persona?.numero_documento || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                    {item.persona?.nombre_completo || 'Sin nombre'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {TIPO_LABELS[item.tipo_persona] || item.tipo_persona}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {item.sede_nombre || item.sede_id}
                    {item.regional_nombre ? (
                      <div className="text-xs text-gray-400">{item.regional_nombre}</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {formatHora(item.timestamp_entrada)}
                  </td>
                  <td className="px-3 py-2 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {formatHora(item.timestamp_salida)}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {item.salida_sin_ingreso ? (
                      <span className="mr-1 inline-flex rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200">
                        Sin ingreso
                      </span>
                    ) : null}
                    {MOTIVO_LABELS[item.motivo_salida || ''] || item.motivo_salida || '—'}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <span
                      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                        item.estado === 'abierto'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.estado === 'abierto' ? 'Dentro' : 'Cerrado'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && (historial?.items?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {historial && historial.total > historial.page_size ? (
          <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Página {historial.page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={loading || page <= 1}
                onClick={() => void cargar(page - 1)}
              >
                Anterior
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={loading || page >= totalPages}
                onClick={() => void cargar(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default VigilanciaAccesoPanel;
