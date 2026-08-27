/**
 * @module pages/lms/LmsAulaTabs
 * @description Pestañas del aula: tablón, trabajos, aprendices y publicar.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { LMS_TABS, type LmsTab } from './lmsConstants';

type Props = Readonly<{
  tab: LmsTab;
  onTab: (t: LmsTab) => void;
  puedePublicar: boolean;
}>;

/**
 * Barra de pestañas del aula.
 */
export function LmsAulaTabs({ tab, onTab, puedePublicar }: Props) {
  const items: Array<{ id: LmsTab; label: string }> = [
    { id: LMS_TABS.tablon, label: 'Tablón' },
    { id: LMS_TABS.trabajos, label: 'Trabajos de clase' },
    { id: LMS_TABS.aprendices, label: 'Aprendices' },
  ];
  if (puedePublicar) {
    items.push({ id: LMS_TABS.publicar, label: 'Publicar actividad' });
  }
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
