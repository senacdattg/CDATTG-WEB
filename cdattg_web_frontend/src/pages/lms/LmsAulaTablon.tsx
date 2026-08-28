/**
 * @module pages/lms/LmsAulaTablon
 * @description Pendientes: lista o vista; el instructor edita en Mis actividades.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { actividadesPendientes } from './lmsActividadFiltro';
import { LmsActividadCard } from './LmsActividadCard';
import { LmsMisActividadVer } from './LmsMisActividadVer';
import type { LmsActividadItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividades: LmsActividadItem[];
  puedePublicar: boolean;
  onAbrirEditar?: (actividadId: number) => void;
  verInicial?: number | null;
}>;

/**
 * Primero se lee la actividad; Editar abre Mis actividades.
 */
export function LmsAulaTablon({ fichaId, actividades, puedePublicar, onAbrirEditar, verInicial = null }: Props) {
  const items = actividadesPendientes(actividades, puedePublicar);
  const [verId, setVerId] = useState<number | null>(verInicial);
  const actual = items.find((a) => a.id === verId);

  if (actual) {
    return (
      <LmsMisActividadVer
        fichaId={fichaId}
        actividad={actual}
        onCerrar={() => setVerId(null)}
        onEditar={onAbrirEditar ? () => onAbrirEditar(actual.id) : undefined}
      />
    );
  }
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-900/40">
        No hay actividades pendientes.
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
            onVer={puedePublicar ? () => setVerId(a.id) : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
