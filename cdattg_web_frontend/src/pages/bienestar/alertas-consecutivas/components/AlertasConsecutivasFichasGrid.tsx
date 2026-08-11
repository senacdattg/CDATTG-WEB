import { Link } from 'react-router-dom';
import { UsersIcon } from '@heroicons/react/24/outline';
import { bienestarPaths } from '../../bienestarPaths';
import { FichaCaracterizacionCard } from '../../../../components/FichaCaracterizacionCard';
import {
  grupoAlertasToFichaCard,
  textoAprendicesConRacha,
  type GrupoAlertasPorFicha,
} from '../alertasConsecutivasUtils';

type AlertasConsecutivasFichasGridProps = Readonly<{
  grupos: GrupoAlertasPorFicha[];
  dias: number;
  tipoFormacion?: string;
  sinResultadosFiltro: boolean;
  hayAlertasEnApi: boolean;
}>;

export function AlertasConsecutivasFichasGrid({
  grupos,
  dias,
  tipoFormacion = '',
  sinResultadosFiltro,
  hayAlertasEnApi,
}: AlertasConsecutivasFichasGridProps) {
  if (!hayAlertasEnApi) {
    return (
      <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
        No se encontraron aprendices con 2 inasistencias consecutivas sin justificar en el período
        seleccionado.
      </div>
    );
  }

  if (sinResultadosFiltro) {
    return (
      <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
        Ninguna ficha coincide con la búsqueda o el programa seleccionado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {grupos.map((grupo) => (
        <FichaCaracterizacionCard
          key={grupo.groupKey}
          ficha={grupoAlertasToFichaCard(grupo)}
          footerLeft={
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <UsersIcon className="h-4 w-4" aria-hidden />
              {textoAprendicesConRacha(grupo.alertas.length)}
            </span>
          }
          extra={
            grupo.activas > 0 ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {grupo.activas} racha{grupo.activas === 1 ? '' : 's'} activa
                {grupo.activas === 1 ? '' : 's'} (últimas 2 fechas de formación)
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rachas históricas en el período (ya no están activas)
              </p>
            )
          }
          actions={
            <Link
              to={bienestarPaths.alertasConsecutivas.ficha(grupo.ficha_numero, {
                sede: grupo.sede_nombre || '',
                dias,
                tipo_formacion: tipoFormacion || undefined,
              })}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Ver aprendices
            </Link>
          }
        />
      ))}
    </div>
  );
}
