/**
 * Lista de quienes están adentro; la pastilla marca quién no sale.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoDentroItem } from '../../types';
import { FILA_QUEDA, FILA_SALE, PILA_QUEDA, PILA_SALE } from './vigilanciaUi';

type Props = Readonly<{
  items: AccesoDentroItem[];
  excluir: ReadonlySet<number>;
  onToggle: (visitaId: number) => void;
}>;

function horaEntrada(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Cada fila: datos a la izquierda, toque en la pastilla para dejarlo adentro.
 */
export function SalidaMasivaLista({ items, excluir, onToggle }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Nadie coincide con la búsqueda.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const queda = excluir.has(it.visita_id);
        const id = `queda-${it.visita_id}`;
        return (
          <li key={it.visita_id} className={queda ? FILA_QUEDA : FILA_SALE}>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {it.persona.nombre_completo || it.persona.numero_documento}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {it.persona.numero_documento} · {it.tipo_persona} · {horaEntrada(it.timestamp_entrada)}
              </p>
            </div>
            <button type="button" id={id} aria-pressed={queda} className={queda ? PILA_QUEDA : PILA_SALE} onClick={() => onToggle(it.visita_id)}>
              Quedarse
            </button>
          </li>
        );
      })}
    </ul>
  );
}
