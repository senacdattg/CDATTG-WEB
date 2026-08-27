/**
 * @module pages/portal/PortalEmptyState
 * @description Estado vacío del listado público de semilleros.
 * @author Cristian Deysdayr Jiménez
 */
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type Props = Readonly<{ titulo: string; detalle: string }>;

/**
 * Bloque centrado cuando no hay resultados.
 */
export function PortalEmptyState({ titulo, detalle }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-gray-700">
        <MagnifyingGlassIcon className="h-10 w-10" aria-hidden />
      </span>
      <h2 className="mt-6 text-lg font-semibold text-gray-800 dark:text-white">{titulo}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{detalle}</p>
    </div>
  );
}
