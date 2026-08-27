/**
 * @module pages/lms/LmsEntregaExito
 * @description Animación breve al confirmar la entrega.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { CheckCircleIcon } from '@heroicons/react/24/solid';

type Props = Readonly<{ visible: boolean }>;

/**
 * Overlay de éxito (se oculta desde el padre).
 */
export function LmsEntregaExito({ visible }: Props) {
  if (visible) {
    return (
      <aside
        role="status"
        aria-live="polite"
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      >
        <p className="flex scale-100 flex-col items-center gap-3 rounded-2xl bg-white px-8 py-7 text-center shadow-xl motion-safe:animate-bounce dark:bg-gray-800">
          <CheckCircleIcon className="h-16 w-16 text-green-500" aria-hidden />
          <span className="text-lg font-semibold text-gray-900 dark:text-white">Entrega exitosa</span>
          <span className="text-sm text-gray-500">Su trabajo quedó registrado.</span>
        </p>
      </aside>
    );
  }
  return null;
}
