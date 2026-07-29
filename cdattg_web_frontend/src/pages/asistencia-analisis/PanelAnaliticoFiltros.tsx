import type { Dispatch, SetStateAction } from 'react';
import type { RegionalItem, SedeItem } from '../../types';

export type EstadoFicha = 'activas' | 'inactivas' | 'todas';

export type FiltrosAplicados = {
  fechaDesde: string;
  fechaHasta: string;
  jornada: string;
  fichaBusqueda: string;
  estadoFicha: EstadoFicha;
  regionalId: string;
  sedeId: string;
};

const JORNADAS = ['', 'DIURNA', 'TARDE', 'NOCHE', 'JORNADA CONTINUA', 'FINES DE SEMANA'] as const;

const fieldCls =
  'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:text-white';

type Props = Readonly<{
  draft: FiltrosAplicados;
  aplicados: FiltrosAplicados;
  setDraft: Dispatch<SetStateAction<FiltrosAplicados>>;
  puedeFiltrarInstitucional: boolean;
  regionales: RegionalItem[];
  sedesFiltradas: SedeItem[];
  onAplicar: () => void;
  onLimpiar: () => void;
  onLimpiarFicha: () => void;
}>;

export function PanelAnaliticoFiltros({
  draft,
  aplicados,
  setDraft,
  puedeFiltrarInstitucional,
  regionales,
  sedesFiltradas,
  onAplicar,
  onLimpiar,
  onLimpiarFicha,
}: Props) {
  const filtroFichaActivo = aplicados.fichaBusqueda.trim().length > 0;

  return (
    <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filtros del panel</h2>
        {filtroFichaActivo ? (
          <span className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/40 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
            Activo: {aplicados.fichaBusqueda.trim()}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="analisis-desde" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Desde
          </label>
          <input
            id="analisis-desde"
            type="date"
            value={draft.fechaDesde}
            onChange={(e) => setDraft((p) => ({ ...p, fechaDesde: e.target.value }))}
            className={fieldCls}
          />
        </div>
        <div>
          <label htmlFor="analisis-hasta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Hasta
          </label>
          <input
            id="analisis-hasta"
            type="date"
            value={draft.fechaHasta}
            onChange={(e) => setDraft((p) => ({ ...p, fechaHasta: e.target.value }))}
            className={fieldCls}
          />
        </div>
        <div>
          <label htmlFor="analisis-jornada" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Jornada
          </label>
          <select
            id="analisis-jornada"
            value={draft.jornada}
            onChange={(e) => setDraft((p) => ({ ...p, jornada: e.target.value }))}
            className={fieldCls}
          >
            <option value="">Todas</option>
            {JORNADAS.filter(Boolean).map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="analisis-estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado de ficha
          </label>
          <select
            id="analisis-estado"
            value={draft.estadoFicha}
            onChange={(e) => setDraft((p) => ({ ...p, estadoFicha: e.target.value as EstadoFicha }))}
            className={fieldCls}
          >
            <option value="activas">Activas</option>
            <option value="inactivas">Inactivas</option>
            <option value="todas">Activas e inactivas</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="analisis-ficha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ficha o programa (opcional)
          </label>
          <div className="flex gap-2">
            <input
              id="analisis-ficha"
              type="text"
              value={draft.fichaBusqueda}
              onChange={(e) => setDraft((p) => ({ ...p, fichaBusqueda: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAplicar();
                }
              }}
              placeholder="Buscar por código de ficha o programa"
              className={fieldCls}
            />
            {filtroFichaActivo || draft.fichaBusqueda.trim() ? (
              <button
                type="button"
                onClick={onLimpiarFicha}
                className="shrink-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Quitar
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Ej. 3173334 o Análisis y desarrollo de software
          </p>
        </div>
      </div>

      {puedeFiltrarInstitucional ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="analisis-regional" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Regional
            </label>
            <select
              id="analisis-regional"
              value={draft.regionalId}
              onChange={(e) => setDraft((p) => ({ ...p, regionalId: e.target.value, sedeId: '' }))}
              className={fieldCls}
            >
              <option value="">Todas las regionales</option>
              {regionales.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="analisis-sede" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sede
            </label>
            <select
              id="analisis-sede"
              value={draft.sedeId}
              onChange={(e) => setDraft((p) => ({ ...p, sedeId: e.target.value }))}
              className={fieldCls}
            >
              <option value="">Todas las sedes</option>
              {sedesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAplicar}
          className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={onLimpiar}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}
