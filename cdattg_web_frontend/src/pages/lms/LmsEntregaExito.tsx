/**
 * @module pages/lms/LmsEntregaExito
 * @description Overlay animado al entregar, publicar, actualizar o eliminar.
 * @author Cristian Deysdayr Jiménez
 */
import { ArrowUturnLeftIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/solid';

export type LmsAvisoEntrega = 'exito' | 'deshacer' | 'publicada' | 'actualizada' | 'eliminada';

type Props = Readonly<{ visible: boolean; variante?: LmsAvisoEntrega }>;

const COPY: Record<LmsAvisoEntrega, { titulo: string; detalle: string }> = {
  exito: { titulo: 'Entrega exitosa', detalle: 'Su trabajo quedó registrado.' },
  deshacer: { titulo: 'Entrega deshecha', detalle: 'Puede adjuntar de nuevo y enviar.' },
  publicada: { titulo: 'Actividad realizada con éxito', detalle: 'Ya está visible en el aula.' },
  actualizada: { titulo: 'Actividad actualizada', detalle: 'Los cambios ya están visibles en el aula.' },
  eliminada: { titulo: 'Actividad eliminada', detalle: 'Ya no aparece en el aula.' },
};

/**
 * Fondo de la tarjeta según el tipo de aviso.
 * @param {LmsAvisoEntrega} variante Tipo de aviso.
 * @returns {string} Clases de color.
 */
function cajaAviso(variante: LmsAvisoEntrega): string {
  if (variante === 'deshacer') {
    return 'bg-amber-50 ring-2 ring-amber-300 dark:bg-gray-800 dark:ring-amber-500';
  }
  if (variante === 'eliminada') {
    return 'bg-red-50 ring-2 ring-red-300 dark:bg-gray-800 dark:ring-red-500';
  }
  return 'bg-white';
}

/**
 * Ícono del overlay.
 * @param {LmsAvisoEntrega} variante Tipo de aviso.
 * @returns El ícono que corresponde.
 */
function iconoAviso(variante: LmsAvisoEntrega) {
  if (variante === 'deshacer') {
    return (
      <ArrowUturnLeftIcon
        className="h-16 w-16 text-amber-500 motion-safe:animate-[spin_0.7s_ease-out]"
        aria-hidden
      />
    );
  }
  if (variante === 'eliminada') {
    return <TrashIcon className="h-16 w-16 text-red-500" aria-hidden />;
  }
  return <CheckCircleIcon className="h-16 w-16 text-green-500" aria-hidden />;
}

/**
 * Cubre la pantalla un momento para que se note el cambio.
 */
export function LmsEntregaExito({ visible, variante = 'exito' }: Props) {
  if (!visible) return null;
  const copy = COPY[variante];
  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
    >
      <p
        className={`flex scale-100 flex-col items-center gap-3 rounded-2xl px-8 py-7 text-center shadow-xl motion-safe:animate-bounce dark:bg-gray-800 ${cajaAviso(variante)}`}
      >
        {iconoAviso(variante)}
        <span className="text-lg font-semibold text-gray-900 dark:text-white">{copy.titulo}</span>
        <span className="text-sm text-gray-500">{copy.detalle}</span>
      </p>
    </aside>
  );
}
