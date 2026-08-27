/**
 * @module pages/lms/LmsAulasPage
 * @description Listado Mis aulas, análogo a Tomar asistencia.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useLmsAulas } from './useLmsAulas';
import { LmsAulasListView } from './LmsAulasListView';

/**
 * Página contenedora de Mis aulas.
 */
export function LmsAulasPage() {
  const page = useLmsAulas();
  return <LmsAulasListView page={page} onVerFicha={() => undefined} />;
}
