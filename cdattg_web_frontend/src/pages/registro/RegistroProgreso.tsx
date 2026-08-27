/**
 * @module pages/registro/RegistroProgreso
 * @description Barra e indicador del paso actual del registro.
 * @author Cristian Deysdayr Jiménez
 */
import { REGISTRO_TITULOS, TOTAL_PASOS } from './registroForm';

type Props = Readonly<{ paso: number }>;

/**
 * Muestra en qué paso está la persona (1 de 5) y el avance visual.
 */
export function RegistroProgreso({ paso }: Props) {
  const actual = Math.min(Math.max(paso, 0), TOTAL_PASOS - 1);
  const pct = ((actual + 1) / TOTAL_PASOS) * 100;
  const titulo = REGISTRO_TITULOS[actual];
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-sena-dark dark:text-gray-200">
        Paso {actual + 1} de {TOTAL_PASOS}
        {' · '}
        {titulo}
      </p>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_PASOS}
        aria-valuenow={actual + 1}
        aria-label={`Paso ${actual + 1} de ${TOTAL_PASOS}: ${titulo}`}
      >
        <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ol className="hidden justify-between gap-1 text-[11px] text-gray-500 sm:flex dark:text-gray-400">
        {REGISTRO_TITULOS.map((t, i) => (
          <li key={t} className={i === actual ? 'font-semibold text-primary-700 dark:text-primary-300' : undefined}>
            {t}
          </li>
        ))}
      </ol>
    </div>
  );
}
