/**
 * @module pages/lms/LmsAulasPage
 * @description Listado Mis aulas, análogo a Tomar asistencia.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { useLmsAulas } from './useLmsAulas';
import { LmsAulasListView } from './LmsAulasListView';
import { LmsFichaModal } from './LmsFichaModal';

/**
 * Página contenedora de Mis aulas.
 */
export function LmsAulasPage() {
  const page = useLmsAulas();
  const [fichaVer, setFichaVer] = useState<number | null>(null);
  return (
    <>
      <LmsAulasListView page={page} onVerFicha={setFichaVer} />
      <LmsFichaModal fichaId={fichaVer} onClose={() => setFichaVer(null)} />
    </>
  );
}
