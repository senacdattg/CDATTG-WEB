/**
 * Filtro Todos y Listos en carnets de biblioteca.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { FiltroListoBiblioteca } from './carnetBiblioteca';

type Props = Readonly<{
  valor: FiltroListoBiblioteca;
  onChange: (v: FiltroListoBiblioteca) => void;
}>;

const BOTONES: { id: FiltroListoBiblioteca; texto: string }[] = [
  { id: 'todos', texto: 'Todos' },
  { id: 'listos', texto: 'Listos' },
];

/**
 * Pinto chips para reconocer de un vistazo qué falta.
 */
export function CarnetBibliotecaEstadoFiltro({ valor, onChange }: Props) {
  return (
    <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">Estado de impresión</legend>
      {BOTONES.map((b) => {
        const activo = valor === b.id;
        const clase = activo
          ? 'rounded-full bg-green-700 px-4 py-1.5 text-sm font-semibold text-white'
          : 'rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';
        return (
          <button key={b.id} type="button" onClick={() => onChange(b.id)} className={clase}>
            {b.texto}
          </button>
        );
      })}
    </fieldset>
  );
}
