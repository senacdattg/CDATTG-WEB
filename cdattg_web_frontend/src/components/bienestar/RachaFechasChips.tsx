import { formatDiaSemana, formatFechaVista } from '../../utils/formatFecha';

type RachaFechasChipsProps = Readonly<{
  fechas: string[];
  size?: 'sm' | 'md';
}>;

export function RachaFechasChips({ fechas, size = 'md' }: RachaFechasChipsProps) {
  if (fechas.length === 0) return <span className="text-sm text-gray-400">—</span>;

  const compact = size === 'sm';
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Fechas de la racha">
      {fechas.map((iso) => {
        const weekday = formatDiaSemana(iso);
        const [dia, mes] = formatFechaVista(iso).split('/');
        return (
          <li
            key={iso}
            className={`flex flex-col items-center rounded-lg border border-amber-200/80 bg-amber-50/80 dark:border-amber-800/70 dark:bg-amber-950/40 ${
              compact ? 'min-w-[3.5rem] px-1.5 py-1' : 'min-w-[4.25rem] px-2.5 py-1.5'
            }`}
          >
            <span
              className={`font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 ${
                compact ? 'text-[9px]' : 'text-[10px]'
              }`}
            >
              {weekday.slice(0, 3)}
            </span>
            <span
              className={`font-semibold tabular-nums text-gray-900 dark:text-white ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              {dia}/{mes}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
