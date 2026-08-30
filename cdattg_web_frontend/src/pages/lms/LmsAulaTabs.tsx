/**
 * @module pages/lms/LmsAulaTabs
 * @description Barra de pestañas del aula según el rol.
 * Lo hice para pintar el orden del aprendiz y el del instructor.
 * Lo usa LmsAulaCuerpo.
 * @author Cristian Deysdayr Jiménez
 */
import type { LmsTab } from './lmsConstants';
import { lmsAulaTabItems } from './lmsAulaTabItems';

type Props = Readonly<{
  tab: LmsTab;
  onTab: (t: LmsTab) => void;
  puedePublicar: boolean;
  puedeVerHistorial?: boolean;
}>;

/**
 * Pestañas del aula.
 */
export function LmsAulaTabs({ tab, onTab, puedePublicar, puedeVerHistorial = false }: Props) {
  const items = lmsAulaTabItems(puedePublicar, puedeVerHistorial);
  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-700" aria-label="Secciones del aula">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onTab(item.id)}
          className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
            tab === item.id
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
