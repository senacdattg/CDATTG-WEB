/**
 * @module pages/lms/LmsAulaVencidas
 * @description Actividades que el aprendiz no entregó y ya vencieron.
 * Lo separé de entregadas para no mezclar lo que sí envió.
 * Lo usa LmsAulaCuerpo.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { actividadesVencidas } from './lmsActividadFiltro';
import { LmsActividadCard } from './LmsActividadCard';
import { LmsMisActividadVer } from './LmsMisActividadVer';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividades: LmsActividadItem[];
  puedeVerNotas?: boolean;
}>;

/**
 * Lista de vencidas. El staff solo las lee.
 */
export function LmsAulaVencidas({ fichaId, actividades, puedeVerNotas = false }: Props) {
  // Solo las que no se entregaron y ya se pasó el plazo.
  const items = actividadesVencidas(actividades, puedeVerNotas);
  const [verId, setVerId] = useState<number | null>(null);
  const actual = items.find((a) => a.id === verId);
  if (actual) {
    return <LmsMisActividadVer fichaId={fichaId} actividad={actual} onCerrar={() => setVerId(null)} />;
  }
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        No hay actividades vencidas.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li key={a.id}>
          <LmsActividadCard
            fichaId={fichaId}
            actividad={a}
            onVer={puedeVerNotas ? () => setVerId(a.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
