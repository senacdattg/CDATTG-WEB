/**
 * @module pages/lms/LmsAulasPage
 * @description Listado Mis aulas, análogo a Tomar asistencia.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useState } from 'react';
import { useLmsAulas } from './useLmsAulas';
import { LmsAulasListView } from './LmsAulasListView';
import { LmsFichaDetalleModal } from './LmsFichaDetalleModal';

/**
 * Modal de ficha solo si hay un id seleccionado.
 */
function modalFicha(fichaId: number | null, onClose: () => void) {
  if (fichaId === null) {
    return null;
  }
  return <LmsFichaDetalleModal fichaId={fichaId} onClose={onClose} />;
}

/**
 * Página contenedora de Mis aulas.
 */
export function LmsAulasPage() {
  const page = useLmsAulas();
  const [fichaVer, setFichaVer] = useState<number | null>(null);
  return (
    <>
      <LmsAulasListView page={page} onVerFicha={setFichaVer} />
      {modalFicha(fichaVer, () => setFichaVer(null))}
    </>
  );
}
