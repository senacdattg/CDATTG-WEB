import { ArrowDownTrayIcon, ArrowPathIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { AlertaConsecutivaItem } from '../../../../types';
import { RachaFechasChips } from '../../../../components/bienestar/RachaFechasChips';
import { etiquetaBotonOficio } from '../oficioSenaAlertasTexto';

const SEARCH_ID = 'alertas-consecutivas-aprendiz-search';

type AlertasConsecutivasAprendicesTableProps = Readonly<{
  fichaNumero: string;
  alertas: AlertaConsecutivaItem[];
  alertasTotal: number;
  busquedaActiva: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  oficioGenerandoId: number | null;
  onGenerarOficio: (alerta: AlertaConsecutivaItem) => void;
}>;

function inicialesNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes.at(-1)?.[0] ?? ''}`.toUpperCase();
}

function BadgeEstado({ activa }: Readonly<{ activa: boolean }>) {
  if (activa) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-200">
        Activa
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      Histórica
    </span>
  );
}

export function AlertasConsecutivasAprendicesTable({
  fichaNumero,
  alertas,
  alertasTotal,
  busquedaActiva,
  searchQuery,
  onSearchQueryChange,
  oficioGenerandoId,
  onGenerarOficio,
}: AlertasConsecutivasAprendicesTableProps) {
  return (
    <div>
      {alertasTotal > 0 && (
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <label htmlFor={SEARCH_ID} className="sr-only">
            Buscar aprendiz
          </label>
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id={SEARCH_ID}
              type="search"
              placeholder="Buscar por documento o nombre…"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
          {busquedaActiva && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {alertas.length} de {alertasTotal} aprendiz{alertasTotal === 1 ? '' : 'es'}
            </p>
          )}
        </div>
      )}

      {alertasTotal === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Sin alertas en esta ficha</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Ningún aprendiz tiene 2 inasistencias consecutivas sin justificar en el período.
          </p>
        </div>
      )}

      {alertasTotal > 0 && alertas.length === 0 && busquedaActiva && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Sin coincidencias</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No hay aprendices que coincidan con «{searchQuery.trim()}».
          </p>
        </div>
      )}

      {alertas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <caption className="sr-only">
              Aprendices con racha de inasistencias en la ficha {fichaNumero}
            </caption>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Aprendiz
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Días
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Fechas
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                  Oficio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700/80 dark:bg-gray-800/50">
              {alertas.map((a) => {
                const diasRacha = a.fechas_racha?.length ?? 0;
                const generando = oficioGenerandoId === a.aprendiz_id;
                return (
                  <tr
                    key={`${a.aprendiz_id}-${a.ficha_numero}`}
                    className="transition-colors hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                          aria-hidden
                        >
                          {inicialesNombre(a.persona_nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {a.persona_nombre}
                          </p>
                          <p className="text-xs tabular-nums text-gray-500 dark:text-gray-400">
                            {a.numero_documento}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                      {diasRacha}
                    </td>
                    <td className="px-4 py-3.5">
                      <RachaFechasChips fechas={a.fechas_racha ?? []} size="sm" />
                    </td>
                    <td className="px-4 py-3.5">
                      <BadgeEstado activa={a.racha_activa} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onGenerarOficio(a)}
                        disabled={oficioGenerandoId != null}
                        className="btn-secondary inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-50"
                        title={etiquetaBotonOficio(diasRacha)}
                        aria-busy={generando}
                      >
                        {generando ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
                        )}
                        <span className="hidden sm:inline">{generando ? 'Generando…' : 'Oficio'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
