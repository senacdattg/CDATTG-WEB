import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Rectangle,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BarShapeProps, PieSectorShapeProps } from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import type { AsistenciaDashboardFichaSinSesion, AsistenciaDashboardPorFicha } from '../../types';
import { formatNumero } from '../../utils/formatFecha';
import { DASHBOARD_CHART_COLORS } from './dashboardChartColors';
import { useDashboardChartTheme } from './useDashboardChartTheme';

function PieSector({ payload, ...sectorProps }: PieSectorShapeProps) {
  const fill = (typeof payload?.fill === 'string' ? payload.fill : undefined) ?? sectorProps.fill;
  return <Sector {...sectorProps} fill={fill} stroke={sectorProps.stroke ?? 'transparent'} strokeWidth={1} />;
}

function ColoredBar(props: BarShapeProps) {
  const fill =
    (typeof props.payload?.fill === 'string' ? props.payload.fill : undefined) ?? props.fill;
  return <Rectangle {...props} fill={fill} />;
}

function truncLabel(value: string, max = 16): string {
  const t = value.trim() || 'Sin dato';
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function colorAsistenciaPct(pct: number): string {
  if (pct >= 80) return DASHBOARD_CHART_COLORS.senaGreen;
  if (pct >= 50) return '#eab308';
  return DASHBOARD_CHART_COLORS.senaOrange;
}

const METRIC_TONE_CLASS: Record<'neutral' | 'green' | 'blue', string> = {
  green:
    'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800',
  blue: 'bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:ring-sky-800',
  neutral:
    'bg-gray-50 text-gray-800 ring-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600',
};

type Bucket = { key: string; conSesion: number; pendientes: number; matriculaSesion: number; vinieron: number };

function accumulate(
  map: Map<string, Bucket>,
  key: string,
  patch: Partial<Omit<Bucket, 'key'>>,
) {
  const prev = map.get(key) ?? { key, conSesion: 0, pendientes: 0, matriculaSesion: 0, vinieron: 0 };
  map.set(key, {
    key,
    conSesion: prev.conSesion + (patch.conSesion ?? 0),
    pendientes: prev.pendientes + (patch.pendientes ?? 0),
    matriculaSesion: prev.matriculaSesion + (patch.matriculaSesion ?? 0),
    vinieron: prev.vinieron + (patch.vinieron ?? 0),
  });
}

function bucketsToSorted(map: Map<string, Bucket>, limit?: number) {
  const rows = [...map.values()].sort(
    (a, b) => b.conSesion + b.pendientes - (a.conSesion + a.pendientes),
  );
  return limit ? rows.slice(0, limit) : rows;
}

type ReporteAsistenciaGraficosProps = Readonly<{
  fecha: string;
  conSesion: AsistenciaDashboardPorFicha[];
  pendientes: AsistenciaDashboardFichaSinSesion[];
  scopeLabel: string;
}>;

export function ReporteAsistenciaGraficos({
  fecha,
  conSesion,
  pendientes,
  scopeLabel,
}: ReporteAsistenciaGraficosProps) {
  const theme = useDashboardChartTheme();

  const stats = useMemo(() => {
    const total = conSesion.length + pendientes.length;
    const coberturaPct = total > 0 ? Math.round((conSesion.length / total) * 100) : 0;
    const vinieron = conSesion.reduce((acc, r) => acc + (r.cantidad_vinieron ?? 0), 0);
    const matriculaSesion = conSesion.reduce((acc, r) => acc + (r.total_aprendices ?? 0), 0);
    const matriculaPendiente = pendientes.reduce((acc, r) => acc + (r.total_aprendices ?? 0), 0);
    const asistenciaPct =
      matriculaSesion > 0 ? Math.round((vinieron / matriculaSesion) * 100) : 0;
    return {
      total,
      coberturaPct,
      vinieron,
      matriculaSesion,
      matriculaPendiente,
      asistenciaPct,
    };
  }, [conSesion, pendientes]);

  const pieData = useMemo(
    () =>
      [
        { name: 'Con sesión', value: conSesion.length, fill: theme.colors.conSesion },
        { name: 'Pendientes', value: pendientes.length, fill: theme.colors.sinSesion },
      ].filter((d) => d.value > 0),
    [conSesion.length, pendientes.length, theme.colors.conSesion, theme.colors.sinSesion],
  );

  const porJornada = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const r of conSesion) {
      accumulate(map, r.jornada_nombre?.trim() || 'Sin jornada', {
        conSesion: 1,
        matriculaSesion: r.total_aprendices ?? 0,
        vinieron: r.cantidad_vinieron ?? 0,
      });
    }
    for (const r of pendientes) {
      accumulate(map, r.jornada_nombre?.trim() || 'Sin jornada', { pendientes: 1 });
    }
    return bucketsToSorted(map).map((b) => ({
      nombre: truncLabel(b.key, 14),
      'Con sesión': b.conSesion,
      Pendientes: b.pendientes,
    }));
  }, [conSesion, pendientes]);

  const porTipo = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const r of conSesion) {
      accumulate(map, r.tipo_formacion_label?.trim() || 'Sin tipo', { conSesion: 1 });
    }
    for (const r of pendientes) {
      accumulate(map, r.tipo_formacion_label?.trim() || 'Sin tipo', { pendientes: 1 });
    }
    return bucketsToSorted(map).map((b) => ({
      nombre: truncLabel(b.key, 18),
      'Con sesión': b.conSesion,
      Pendientes: b.pendientes,
    }));
  }, [conSesion, pendientes]);

  const porSede = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const r of conSesion) {
      accumulate(map, r.sede_nombre?.trim() || 'Sin sede', {
        conSesion: 1,
        matriculaSesion: r.total_aprendices ?? 0,
        vinieron: r.cantidad_vinieron ?? 0,
      });
    }
    for (const r of pendientes) {
      accumulate(map, r.sede_nombre?.trim() || 'Sin sede', { pendientes: 1 });
    }
    return bucketsToSorted(map, 8).map((b) => ({
      nombre: truncLabel(b.key, 16),
      'Con sesión': b.conSesion,
      Pendientes: b.pendientes,
      Asistieron: b.vinieron,
      Matrícula: b.matriculaSesion,
    }));
  }, [conSesion, pendientes]);

  const topAsistencia = useMemo(() => {
    return conSesion
      .map((r) => {
        const total = r.total_aprendices ?? 0;
        const vinieron = r.cantidad_vinieron ?? 0;
        const pct = total > 0 ? Math.round((vinieron / total) * 100) : 0;
        return {
          ficha: r.ficha_numero,
          label: truncLabel(`${r.ficha_numero}`, 12),
          pct,
          vinieron,
          total,
          fill: colorAsistenciaPct(pct),
        };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10);
  }, [conSesion]);

  if (stats.total === 0) {
    return (
      <div className="card py-12 text-center">
        <ChartBarIcon className="mx-auto h-10 w-10 text-gray-400" aria-hidden />
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          No hay fichas con formación hoy en el ámbito filtrado para graficar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden border-primary-200/60 dark:border-primary-800/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Resumen gráfico</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Cobertura de sesión el {fecha}
              {scopeLabel ? ` · ${scopeLabel}` : ''}. Compara fichas con sesión abierta frente a pendientes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <MetricChip
              label="Fichas en filtro"
              value={formatNumero(stats.total)}
              tone="neutral"
            />
            <MetricChip
              label="Cobertura de sesión"
              value={`${stats.coberturaPct}%`}
              tone="green"
            />
            <MetricChip
              label="Asist. en sesiones"
              value={`${stats.asistenciaPct}%`}
              hint={`${formatNumero(stats.vinieron)} / ${formatNumero(stats.matriculaSesion)}`}
              tone="blue"
            />
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-700 ease-out"
            style={{ width: `${stats.coberturaPct}%` }}
            title={`${stats.coberturaPct}% con sesión`}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            {formatNumero(conSesion.length)} con sesión
          </span>
          {' · '}
          <span className="font-medium text-amber-700 dark:text-amber-300">
            {formatNumero(pendientes.length)} pendientes
          </span>
          {stats.matriculaPendiente > 0 && (
            <>
              {' · '}
              {formatNumero(stats.matriculaPendiente)} aprendices en fichas aún sin sesión
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            Sesión vs pendientes
          </h3>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Distribución de fichas con formación hoy según apertura de toma de asistencia.
          </p>
          <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  shape={PieSector}
                />
                <Tooltip
                  contentStyle={theme.tooltip.contentStyle}
                  labelStyle={theme.tooltip.labelStyle}
                  itemStyle={theme.tooltip.itemStyle}
                  formatter={(value) => [formatNumero(Number(value ?? 0)), 'Fichas']}
                />
                <Legend wrapperStyle={{ color: theme.legend.color }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-6">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
                  {stats.coberturaPct}%
                </p>
                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  cobertura
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">Por jornada</h3>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Cuántas fichas ya registraron sesión y cuántas faltan, agrupadas por jornada.
          </p>
          {porJornada.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porJornada} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid
                  stroke={theme.grid.stroke}
                  strokeDasharray={theme.grid.strokeDasharray}
                  vertical={false}
                />
                <XAxis
                  dataKey="nombre"
                  tick={theme.axis.tick}
                  axisLine={{ stroke: theme.axis.stroke }}
                  tickLine={{ stroke: theme.axis.stroke }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={theme.axis.tick}
                  axisLine={{ stroke: theme.axis.stroke }}
                  tickLine={{ stroke: theme.axis.stroke }}
                />
                <Tooltip
                  contentStyle={theme.tooltip.contentStyle}
                  labelStyle={theme.tooltip.labelStyle}
                  itemStyle={theme.tooltip.itemStyle}
                />
                <Legend wrapperStyle={{ color: theme.legend.color }} />
                <Bar
                  dataKey="Con sesión"
                  stackId="a"
                  fill={theme.colors.conSesion}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="Pendientes"
                  stackId="a"
                  fill={theme.colors.sinSesion}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {porTipo.length > 1 && (
          <div className="card">
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
              Por tipo de formación
            </h3>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Comparativo entre Regular, Media Técnica y Complementaria en el filtro actual.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porTipo} margin={{ top: 8, right: 8, left: 0, bottom: 32 }}>
                <CartesianGrid
                  stroke={theme.grid.stroke}
                  strokeDasharray={theme.grid.strokeDasharray}
                  vertical={false}
                />
                <XAxis
                  dataKey="nombre"
                  tick={theme.axis.tick}
                  axisLine={{ stroke: theme.axis.stroke }}
                  tickLine={{ stroke: theme.axis.stroke }}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  allowDecimals={false}
                  tick={theme.axis.tick}
                  axisLine={{ stroke: theme.axis.stroke }}
                  tickLine={{ stroke: theme.axis.stroke }}
                />
                <Tooltip
                  contentStyle={theme.tooltip.contentStyle}
                  labelStyle={theme.tooltip.labelStyle}
                  itemStyle={theme.tooltip.itemStyle}
                />
                <Legend wrapperStyle={{ color: theme.legend.color }} />
                <Bar dataKey="Con sesión" fill={theme.colors.conSesion} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pendientes" fill={theme.colors.sinSesion} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={`card ${porTipo.length > 1 ? '' : 'lg:col-span-2'}`}>
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            Por sede {porSede.length >= 8 ? '(top 8)' : ''}
          </h3>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Fichas con sesión abierta frente a pendientes, por sede.
          </p>
          {porSede.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porSede} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
                <CartesianGrid
                  stroke={theme.grid.stroke}
                  strokeDasharray={theme.grid.strokeDasharray}
                  vertical={false}
                />
                <XAxis
                  dataKey="nombre"
                  tick={theme.axis.tick}
                  axisLine={{ stroke: theme.axis.stroke }}
                  tickLine={{ stroke: theme.axis.stroke }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  allowDecimals={false}
                  tick={theme.axis.tick}
                  axisLine={{ stroke: theme.axis.stroke }}
                  tickLine={{ stroke: theme.axis.stroke }}
                />
                <Tooltip
                  contentStyle={theme.tooltip.contentStyle}
                  labelStyle={theme.tooltip.labelStyle}
                  itemStyle={theme.tooltip.itemStyle}
                />
                <Legend wrapperStyle={{ color: theme.legend.color }} />
                <Bar dataKey="Con sesión" fill={theme.colors.conSesion} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pendientes" fill={theme.colors.sinSesion} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {topAsistencia.length > 0 && (
        <div className="card">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            Asistencia efectiva en fichas con sesión
          </h3>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Top 10 por % de aprendices con ingreso registrado (sesión abierta ≠ marcas de asistencia).
          </p>
          <ResponsiveContainer width="100%" height={Math.max(220, topAsistencia.length * 36)}>
            <BarChart
              data={topAsistencia}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
            >
              <CartesianGrid
                stroke={theme.grid.stroke}
                strokeDasharray={theme.grid.strokeDasharray}
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                unit="%"
                tick={theme.axis.tick}
                axisLine={{ stroke: theme.axis.stroke }}
                tickLine={{ stroke: theme.axis.stroke }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={72}
                tick={theme.axis.tick}
                axisLine={{ stroke: theme.axis.stroke }}
                tickLine={{ stroke: theme.axis.stroke }}
              />
              <Tooltip
                contentStyle={theme.tooltip.contentStyle}
                labelStyle={theme.tooltip.labelStyle}
                itemStyle={theme.tooltip.itemStyle}
                formatter={(value, _name, item) => {
                  const row = item?.payload as { vinieron?: number; total?: number } | undefined;
                  return [
                    `${Number(value ?? 0)}% (${formatNumero(row?.vinieron ?? 0)} / ${formatNumero(row?.total ?? 0)})`,
                    '% asistencia',
                  ];
                }}
              />
              <Bar
                dataKey="pct"
                name="% asistencia"
                radius={[0, 6, 6, 0]}
                barSize={18}
                shape={ColoredBar}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Sin datos para graficar.</p>
  );
}

type MetricChipProps = Readonly<{
  label: string;
  value: string;
  hint?: string;
  tone: 'neutral' | 'green' | 'blue';
}>;

function MetricChip({ label, value, hint, tone }: MetricChipProps) {
  return (
    <div className={`rounded-xl px-3 py-2 ring-1 ${METRIC_TONE_CLASS[tone]}`}>
      <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
      {hint && <p className="text-[11px] opacity-70">{hint}</p>}
    </div>
  );
}
