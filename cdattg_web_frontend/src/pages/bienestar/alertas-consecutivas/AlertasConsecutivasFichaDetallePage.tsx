import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { bienestarPaths } from '../bienestarPaths';
import { etiquetaPeriodoCasosBienestar } from '../casos/casosBienestarUtils';
import { AlertasConsecutivasAprendicesTable } from './components/AlertasConsecutivasAprendicesTable';
import { AlertasConsecutivasCriteriosCard } from './components/AlertasConsecutivasCriteriosCard';
import { useAlertasConsecutivasFichaDetalle } from './hooks/useAlertasConsecutivasFichaDetalle';

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: Readonly<{
  label: string;
  value: number;
  hint?: string;
  icon: typeof UserGroupIcon;
  tone: 'amber' | 'red' | 'gray';
}>) {
  const tones = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  const valueTone = {
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-800 dark:text-gray-100',
  };

  return (
    <div className="card flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className={`text-2xl font-bold tabular-nums ${valueTone[tone]}`}>{value}</p>
        {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
      </div>
    </div>
  );
}

export function AlertasConsecutivasFichaDetallePage() {
  const page = useAlertasConsecutivasFichaDetalle();
  const periodo = etiquetaPeriodoCasosBienestar(page.dias, page.data?.fecha_inicio, page.data?.fecha_fin);

  if (!page.canView) {
    return (
      <div className="space-y-6">
        <p role="alert" className="text-red-600 dark:text-red-400">
          {page.permissionError}
        </p>
        <Link
          to={bienestarPaths.alertasConsecutivas.index}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver al listado de alertas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={bienestarPaths.alertasConsecutivas.index}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden />
            Alertas consecutivas
          </Link>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Ficha {page.fichaNumero}</p>
          <h1 className="mt-0.5 text-3xl font-bold text-gray-900 dark:text-white">
            Inasistencias consecutivas
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Aprendices con 2 o más faltas seguidas sin justificar en el calendario de formación de la ficha.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {page.sedeNombre ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {page.sedeNombre}
              </span>
            ) : null}
            {page.jornadaNombre ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {page.jornadaNombre}
              </span>
            ) : null}
            {page.programaNombre ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {page.programaNombre}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <AlertasConsecutivasCriteriosCard
        dias={page.dias}
        tipoFormacion={page.tipoFormacion}
        onDiasChange={page.setDias}
        onTipoFormacionChange={page.setTipoFormacion}
      />

      {page.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {page.error}
        </div>
      )}

      {page.oficioError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {page.oficioError}
        </div>
      )}

      {page.loading ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando alertas…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard
              label="Aprendices en alerta"
              value={page.alertasFichaTotal}
              hint={periodo}
              icon={UserGroupIcon}
              tone="amber"
            />
            <KpiCard
              label="Rachas activas"
              value={page.activas}
              hint="Últimas 2 fechas de formación"
              icon={ExclamationTriangleIcon}
              tone="red"
            />
            <KpiCard
              label="Históricas"
              value={page.historicas}
              hint="Ya no están activas"
              icon={ClockIcon}
              tone="gray"
            />
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aprendices</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Ordenados por más días de racha. Genere el oficio GD-F-008 para notificar el incumplimiento.
              </p>
            </div>
            <AlertasConsecutivasAprendicesTable
              fichaNumero={page.fichaNumero}
              alertas={page.alertasFicha}
              alertasTotal={page.alertasFichaTotal}
              busquedaActiva={page.busquedaActiva}
              searchQuery={page.searchQuery}
              onSearchQueryChange={page.setSearchQuery}
              oficioGenerandoId={page.oficioGenerandoId}
              onGenerarOficio={(alerta) => void page.generarOficioAprendiz(alerta)}
            />
          </div>
        </>
      )}
    </div>
  );
}
