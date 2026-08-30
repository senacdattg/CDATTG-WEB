/**
 * @module pages/lms/LmsAulaHistorialFiltros
 * @description Busca por aprendiz en el historial.
 * Lo usa LmsAulaHistorial.
 * @author Cristian Deysdayr Jiménez
 */

type Props = Readonly<{
  aprendiz: string;
  onAprendiz: (v: string) => void;
}>;

/**
 * Recuadro de nombre del aprendiz.
 */
export function LmsAulaHistorialFiltros({ aprendiz, onAprendiz }: Props) {
  return (
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
  );
}
