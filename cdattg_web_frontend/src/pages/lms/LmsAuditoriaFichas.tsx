/**
 * @module pages/lms/LmsAuditoriaFichas
 * @description Tarjetas de ficha cuando el filtro es un número de ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsAulaCard } from './LmsAulasCards';
import { lmsPaths } from '../../routes/paths';
import type { LmsAulaListItem } from '../../types/lms';

type Props = Readonly<{ fichas: LmsAulaListItem[]; onVerFicha: (id: number) => void }>;

/**
 * Misma tarjeta de Mis aulas. Ver más abre el detalle; Auditar abre las carpetas.
 */
export function LmsAuditoriaFichas({ fichas, onVerFicha }: Props) {
  if (fichas.length === 0) {
    return <p className="text-sm text-gray-500">No hay fichas para esta búsqueda.</p>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {fichas.map((aula) => (
        <li key={aula.ficha_id}>
          <LmsAulaCard
            aula={aula}
            onVerFicha={onVerFicha}
            entrarTo={lmsPaths.auditoriaFicha(aula.ficha_id)}
            entrarLabel="Auditar"
          />
        </li>
      ))}
    </ul>
  );
}
