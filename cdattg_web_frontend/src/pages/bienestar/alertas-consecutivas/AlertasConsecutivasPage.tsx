import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { asistenciaPaths } from '../../../routes/paths';
import { CasosBienestarListaFilters } from '../casos/components/CasosBienestarListaFilters';
import { etiquetaPeriodoCasosBienestar } from '../casos/casosBienestarUtils';
import { AlertasConsecutivasCriteriosCard } from './components/AlertasConsecutivasCriteriosCard';
import { AlertasConsecutivasFichasGrid } from './components/AlertasConsecutivasFichasGrid';
import { useAlertasConsecutivasListaPage } from './hooks/useAlertasConsecutivasListaPage';

export function AlertasConsecutivasPage() {
  const page = useAlertasConsecutivasListaPage();

  if (!page.canView) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">{page.permissionError}</p>
        <Link to={asistenciaPaths.index} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" aria-hidden />
            Alertas consecutivas
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Aprendices con 2 o más inasistencias sin justificar en días de formación consecutivos de la ficha.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            El calendario es el mismo de casos de bienestar: festivos, PARO y días sin formación no cuentan. Varios
            instructores el mismo día se consolidan en una sola fecha.
          </p>
        </div>
        <Link to={asistenciaPaths.index} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Volver al Dashboard
        </Link>
      </div>

      <AlertasConsecutivasCriteriosCard
        dias={page.dias}
        tipoFormacion={page.tipoFormacion}
        onDiasChange={page.setDias}
        onTipoFormacionChange={page.setTipoFormacion}
      />

      {!page.loading && page.data && page.data.alertas.length > 0 && (
        <CasosBienestarListaFilters
          searchQuery={page.searchQuery}
          onSearchQueryChange={page.setSearchQuery}
          programaFiltroIndex={page.programaFiltroIndex}
          onProgramaFiltroIndexChange={page.setProgramaFiltroIndex}
          programasOpciones={page.programasOpciones}
        />
      )}

      {page.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {page.error}
        </div>
      )}

      {page.loading && (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
          Cargando alertas…
        </div>
      )}

      {!page.loading && page.data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Alertas detectadas</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{page.data.alertas.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {etiquetaPeriodoCasosBienestar(
                  page.data.dias_analizados,
                  page.data.fecha_inicio,
                  page.data.fecha_fin,
                )}
              </p>
              {page.filtrosActivos && page.alertasPorFicha.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Mostrando {page.gruposFiltrados.length} de {page.alertasPorFicha.length} fichas
                </p>
              )}
            </div>
            <div className="card p-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Criterio</p>
              <p className="text-sm text-gray-900 dark:text-white">
                2 inasistencias seguidas en el calendario de formación de la ficha, sin justificación.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Fichas con alertas consecutivas
            </h2>
            <AlertasConsecutivasFichasGrid
              grupos={page.gruposFiltrados}
              dias={page.dias}
              tipoFormacion={page.tipoFormacion}
              hayAlertasEnApi={page.data.alertas.length > 0}
              sinResultadosFiltro={page.data.alertas.length > 0 && page.gruposFiltrados.length === 0}
            />
          </div>
        </>
      )}
    </div>
  );
}
