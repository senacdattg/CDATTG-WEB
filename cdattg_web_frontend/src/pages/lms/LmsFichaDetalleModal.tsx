/**
 * @module pages/lms/LmsFichaDetalleModal
 * @description Overlay para ver la ficha sin salir de Mis aulas.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useRef } from 'react';
import { FichaDetalleEmbedded } from '../ficha-detalle/FichaDetalleEmbedded';

type Props = Readonly<{ fichaId: number; onClose: () => void }>;

/**
 * Diálogo nativo con el detalle de ficha embebido.
 */
export function LmsFichaDetalleModal({ fichaId, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.open === false) el.showModal();
    const onCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    el.addEventListener('cancel', onCancel);
    return () => {
      el.removeEventListener('cancel', onCancel);
      if (el.open) el.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-black/60 p-3 sm:p-6"
      aria-label="Detalle de la ficha"
    >
      <div className="mx-auto max-w-6xl">
        <FichaDetalleEmbedded fichaId={fichaId} onClose={onClose} />
      </div>
    </dialog>
  );
}
