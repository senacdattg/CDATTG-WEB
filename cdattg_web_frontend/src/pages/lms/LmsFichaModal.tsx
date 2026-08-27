/**
 * @module pages/lms/LmsFichaModal
 * @description Abre el detalle de ficha cuando hay un id.
 * @author CRANDEYS
 * @created 2026-08-27
 */
import { LmsFichaDetalleModal } from './LmsFichaDetalleModal';

type Props = Readonly<{ fichaId: number | null; onClose: () => void }>;

/**
 * Renderiza el modal solo con un id de ficha.
 */
export function LmsFichaModal({ fichaId, onClose }: Props) {
  if (fichaId) {
    return <LmsFichaDetalleModal fichaId={fichaId} onClose={onClose} />;
  }
  return null;
}
