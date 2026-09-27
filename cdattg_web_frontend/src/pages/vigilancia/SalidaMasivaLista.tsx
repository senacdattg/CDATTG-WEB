/**
 * Lista de quienes están adentro, con casilla para dejarlos.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoDentroItem } from '../../types';

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
 * Pinto cada persona y dejo marcar “queda adentro”.
 */
export function SalidaMasivaLista({ items, excluir, onToggle }: Props) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Nadie coincide con la búsqueda.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
      {items.map((it) => {
        const queda = excluir.has(it.visita_id);
        const id = `queda-${it.visita_id}`;
        return (
          <li key={it.visita_id} className={`flex flex-wrap items-center justify-between gap-2 py-2 ${queda ? 'opacity-70' : ''}`}>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {it.persona.nombre_completo || it.persona.numero_documento}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {it.persona.numero_documento} · {it.tipo_persona} · {horaEntrada(it.timestamp_entrada)}
              </p>
            </div>
            <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
              <input id={id} type="checkbox" checked={queda} onChange={() => onToggle(it.visita_id)} />
              {' '}
              <span>Queda adentro</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
