/**
 * Fila de un aprendiz con carnet regular: normal o con chulito de listo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { urlFotoBiblioteca } from '../../../services/carnetApi';
import type { CarnetBibliotecaItem } from '../../../types/carnet';
import { CarnetPendienteFoto } from '../shared/CarnetPendienteFoto';

type Props = Readonly<{
  item: CarnetBibliotecaItem;
  puedeMarcar: boolean;
  onVerFoto: (item: CarnetBibliotecaItem) => void;
  onMarcarListo: (item: CarnetBibliotecaItem, listo: boolean) => void;
}>;

/**
 * Pinto la tarjeta: si está listo, verde y el sello; si no, igual que antes.
 */
export function CarnetBibliotecaFila({ item, puedeMarcar, onVerFoto, onMarcarListo }: Props) {
  const caja = item.listo
    ? 'rounded-xl border-2 border-green-600 bg-green-50 p-4 shadow-sm dark:border-green-400 dark:bg-green-950/50'
    : 'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800';
  return (
    <article className={`flex flex-wrap items-center gap-4 ${caja}`}>
      <CarnetPendienteFoto id={item.id} fotoUrl={urlFotoBiblioteca(item.id)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {item.nombres} {item.apellidos}
          </h2>
          {item.listo ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-700 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
              ✓ Listo
            </span>
          ) : null}
        </div>
        {item.listo ? (
          <p className="mt-1 text-sm font-medium text-green-800 dark:text-green-300">Ya quedó hecho.</p>
        ) : null}
        <p className="text-sm text-gray-600 dark:text-gray-300">
          CC {item.numero_documento} · RH {item.rh || '—'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Grupo No. {item.ficha_numero} · {item.programa}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-300">Instructor líder. {item.instructor_lider || '—'}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" className="btn-secondary" onClick={() => onVerFoto(item)}>
          Ver
        </button>
        {puedeMarcar ? (
          <button
            type="button"
            className={item.listo ? 'btn-outline-gray' : 'btn-sena'}
            onClick={() => onMarcarListo(item, !item.listo)}
          >
            {item.listo ? 'Quitar listo' : 'Marcar listo'}
          </button>
        ) : null}
      </div>
    </article>
  );
}
