import { FunnelIcon } from '@heroicons/react/24/outline';
import {
  CASOS_BIEN_DIAS_HISTORICO,
  CASOS_BIEN_DIAS_OPCIONES,
} from '../../casos/casosBienestarConstants';
import { TIPO_FORMACION_OPTIONS } from '../../../../constants/tipoFormacion';

const DIAS_ID = 'alertas-consecutivas-dias';
const TIPO_ID = 'alertas-consecutivas-tipo-formacion';

type AlertasConsecutivasCriteriosCardProps = Readonly<{
  dias: number;
  tipoFormacion: string;
  onDiasChange: (dias: number) => void;
  onTipoFormacionChange: (tipo: string) => void;
}>;

export function AlertasConsecutivasCriteriosCard({
  dias,
  tipoFormacion,
  onDiasChange,
  onTipoFormacionChange,
}: AlertasConsecutivasCriteriosCardProps) {
  const esHistorico = dias === CASOS_BIEN_DIAS_HISTORICO;

  return (
    <div className="card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <FunnelIcon className="h-5 w-5" aria-hidden />
        Criterios de análisis
      </h2>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor={DIAS_ID} className="text-sm text-gray-600 dark:text-gray-400">
            {esHistorico ? 'Período' : 'Últimos'}
          </label>
          <select
            id={DIAS_ID}
            value={dias}
            onChange={(e) => onDiasChange(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {CASOS_BIEN_DIAS_OPCIONES.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={TIPO_ID} className="text-sm text-gray-600 dark:text-gray-400">
            Tipo de formación
          </label>
          <select
            id={TIPO_ID}
            value={tipoFormacion}
            onChange={(e) => onTipoFormacionChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Todos</option>
            {TIPO_FORMACION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
