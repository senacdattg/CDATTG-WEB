import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { AlertaConsecutivaItem } from '../../types';
import { formatDiaSemana, formatFechaVista } from '../../utils/formatFecha';
import { aprendizPaths } from '../../routes/paths';

type AlertaConsecutivaBannerProps = Readonly<{
  alertas: AlertaConsecutivaItem[];
  compact?: boolean;
  showLink?: boolean;
}>;

function textoDiasRacha(n: number): string {
  if (n === 1) return '1 día de formación';
  return `${n} días de formación seguidos`;
}

function ChipFecha({ iso }: Readonly<{ iso: string }>) {
  const weekday = formatDiaSemana(iso);
  const [dia, mes] = formatFechaVista(iso).split('/');
  return (
    <li className="flex min-w-[4.25rem] flex-col items-center rounded-lg border border-amber-200/80 bg-white px-2.5 py-1.5 dark:border-amber-700/70 dark:bg-gray-900/70">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
        {weekday.slice(0, 3)}
      </span>
      <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
        {dia}/{mes}
      </span>
    </li>
  );
}

function AlertaConsecutivaCard({
  alerta,
  compact,
}: Readonly<{ alerta: AlertaConsecutivaItem; compact: boolean }>) {
  const fechas = alerta.fechas_racha ?? [];
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-lg font-bold tabular-nums text-amber-800 dark:text-amber-200">
          {textoDiasRacha(fechas.length)}
        </p>
        {alerta.racha_activa ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-800 dark:bg-red-900/50 dark:text-red-200">
            Racha activa
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
            Histórica
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
        Ficha <span className="font-semibold text-gray-900 dark:text-white">{alerta.ficha_numero}</span>
        {alerta.programa_nombre ? (
          <span className="text-gray-500 dark:text-gray-400"> · {alerta.programa_nombre}</span>
        ) : null}
      </p>
      {fechas.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Fechas de la racha">
          {fechas.map((iso) => (
            <ChipFecha key={iso} iso={iso} />
          ))}
        </ul>
      ) : null}
      {compact ? null : (
        <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          Inasistencias sin justificar en días de formación consecutivos de la ficha. Un día con asistencia o
          justificada corta la racha.
        </p>
      )}
    </div>
  );
}

export function AlertaConsecutivaBanner({
  alertas,
  compact = false,
  showLink = false,
}: AlertaConsecutivaBannerProps) {
  if (alertas.length === 0) return null;

  return (
    <section
      aria-labelledby="alerta-consecutiva-titulo"
      className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/80 shadow-sm dark:border-amber-800/80 dark:from-amber-950/40 dark:to-gray-900"
    >
      <div className="flex gap-3 p-4 sm:p-5">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-200"
          aria-hidden
        >
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <p
              id="alerta-consecutiva-titulo"
              className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300"
            >
              Alerta de inasistencias consecutivas
            </p>
            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
              Inasistencias consecutivas sin justificar
            </p>
          </div>
          {alertas.map((alerta) => (
            <AlertaConsecutivaCard
              key={`${alerta.aprendiz_id}-${alerta.ficha_numero}`}
              alerta={alerta}
              compact={compact}
            />
          ))}
          {showLink ? (
            <Link
              to={aprendizPaths.misInasistencias}
              className="inline-flex text-sm font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
            >
              Ver detalle en Mis inasistencias
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
