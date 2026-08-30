/**
 * @module pages/lms/LmsAulaHistorialFiltros
 * @description Busca por aprendiz, elige actividad y recorta por estado.
 * La lista de actividades es la del instructor (o todas si es superadmin).
 * Lo usa LmsAulaHistorial.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsHistorialColumna } from './lmsHistorialMatriz';
import { leerActividadId, type LmsHistorialEstadoFiltro } from './lmsHistorialFiltro';

type Props = Readonly<{
  aprendiz: string;
  actividadId: number | null;
  actividades: LmsHistorialColumna[];
  estado: LmsHistorialEstadoFiltro;
  onAprendiz: (v: string) => void;
  onActividad: (v: number | null) => void;
  onEstado: (v: LmsHistorialEstadoFiltro) => void;
}>;

const ESTADOS: ReadonlyArray<{ id: LmsHistorialEstadoFiltro; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'activos', label: 'Activos' },
  { id: 'ocultos', label: 'Ocultos en asistencia' },
];

/**
 * Nombre, lista de actividades y chips de estado.
 */
export function LmsAulaHistorialFiltros({
  aprendiz,
  actividadId,
  actividades,
  estado,
  onAprendiz,
  onActividad,
  onEstado,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <CampoFiltro
          id="lms-hist-aprendiz"
          label="Filtrar por aprendiz"
          value={aprendiz}
          placeholder="Nombre del aprendiz…"
          onChange={onAprendiz}
        />
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
      <nav className="flex flex-wrap gap-2" aria-label="Estado en asistencia">
        {ESTADOS.map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => onEstado(op.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              estado === op.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            {op.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/**
 * Recuadro de texto de un recorte.
 * @param {string} id Id del campo.
 * @param {string} label Texto visible.
 * @param {string} value Valor escrito.
 * @param {string} placeholder Ayuda del recuadro.
 * @param {(v: string) => void} onChange Guarda lo escrito.
 */
function CampoFiltro({
  id,
  label,
  value,
  placeholder,
  onChange,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}>) {
  return (
    <p>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        id={id}
        type="search"
        className="input-field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </p>
  );
}
