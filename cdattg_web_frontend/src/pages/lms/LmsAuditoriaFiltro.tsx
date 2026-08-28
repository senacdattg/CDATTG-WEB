/**
 * @module pages/lms/LmsAuditoriaFiltro
 * @description Caja de búsqueda por cédula, nombre o ficha.
 * @author Cristian Deysdayr Jiménez
 */

type Props = Readonly<{
  valor: string;
  onChange: (v: string) => void;
}>;

/**
 * Filtro único. Lo pongo arriba del listado de carpetas raíz.
 */
export function LmsAuditoriaFiltro({ valor, onChange }: Props) {
  return (
    <p>
      <label htmlFor="lms-auditoria-q" className="sr-only">
        Buscar por cédula, nombre o ficha
      </label>
      <input
        id="lms-auditoria-q"
        type="search"
        className="input-field max-w-md"
        placeholder="Cédula, nombre o número de ficha…"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    </p>
  );
}
