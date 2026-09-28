/**
 * Filtro del catálogo: una ficha y cuántos ya están listos.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { CarnetBibliotecaFicha, CarnetBibliotecaItem } from '../../../types/carnet';
import { avanceListoDeFicha, etiquetaAvanceListo } from './carnetBibliotecaAvance';

type Props = Readonly<{
  fichas: CarnetBibliotecaFicha[];
  items: CarnetBibliotecaItem[];
  fichaId: number;
  onChange: (id: number) => void;
}>;

/**
 * Pinto el select con 1/5 y el % en cada ficha.
 */
export function CarnetBibliotecaFiltro({ fichas, items, fichaId, onChange }: Props) {
  const elegido = fichaId > 0 ? avanceListoDeFicha(items, fichaId) : null;
  const pct = elegido && elegido.total > 0 ? Math.round((elegido.listos / elegido.total) * 100) : 0;
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-200">
      <span className="block">Seleccionar ficha</span>
      <select
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800"
        value={fichaId}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        <option value={0}>Seleccionar ficha</option>
        {fichas.map((f) => {
          const avance = avanceListoDeFicha(items, f.id);
          return (
            <option key={f.id} value={f.id}>
              {f.numero} · {f.programa} · {etiquetaAvanceListo(avance)}
            </option>
          );
        })}
      </select>
      {elegido ? (
        <span className="mt-2 block">
          <span className="mb-1 flex justify-between text-xs font-medium text-gray-600 dark:text-gray-300">
            <span>Listos en esta ficha</span>
            <span>{etiquetaAvanceListo(elegido)}</span>
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <span className="block h-full rounded-full bg-green-700" style={{ width: `${pct}%` }} />
          </span>
        </span>
      ) : null}
    </label>
  );
}
