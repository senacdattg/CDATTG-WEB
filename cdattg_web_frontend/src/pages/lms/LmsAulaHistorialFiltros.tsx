/**
 * @module pages/lms/LmsAulaHistorialFiltros
 * @description Busca por aprendiz y elige actividad.
 * La lista de actividades es la del instructor.
 * Lo usa LmsAulaHistorial.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsHistorialColumna } from './lmsHistorialMatriz';
import { leerActividadId } from './lmsHistorialFiltro';

type Props = Readonly<{
  aprendiz: string;
  actividadId: number | null;
  actividades: LmsHistorialColumna[];
  onAprendiz: (v: string) => void;
  onActividad: (v: number | null) => void;
}>;

/**
 * Nombre y lista de actividades.
 */
export function LmsAulaHistorialFiltros({
  aprendiz,
  actividadId,
  actividades,
  onAprendiz,
  onActividad,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <p>
        <label htmlFor="lms-hist-aprendiz" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtrar por aprendiz
        </label>
        <input
          id="lms-hist-aprendiz"
          type="search"
          className="input-field"
          value={aprendiz}
          placeholder="Nombre del aprendiz…"
          onChange={(e) => onAprendiz(e.target.value)}
        />
      </p>
      <p>
        <label htmlFor="lms-hist-actividad" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Filtrar por actividad
        </label>
        <select
          id="lms-hist-actividad"
          className="input-field"
          value={actividadId ?? ''}
          onChange={(e) => onActividad(leerActividadId(e.target.value))}
        >
          <option value="">Todas las actividades</option>
          {actividades.map((a) => (
            <option key={a.actividadId} value={a.actividadId}>
              {a.titulo}
            </option>
          ))}
        </select>
      </p>
    </div>
  );
}
