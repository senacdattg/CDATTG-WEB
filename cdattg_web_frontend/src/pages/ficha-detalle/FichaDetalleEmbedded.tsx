/**
 * @module pages/ficha-detalle/FichaDetalleEmbedded
 * @description Detalle de ficha reutilizado (LMS u overlay) sin cambiar de ruta.
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FichaDetalleAprendicesTab } from './components/aprendices/FichaDetalleAprendicesTab';
import { FichaDetalleInstructoresTab } from './components/FichaDetalleInstructoresTab';
import { FichaDetalleLoadingState } from './components/FichaDetallePageStates';
import { FichaDetalleResumen } from './components/FichaDetalleResumen';
import { FichaDetalleTabsNav } from './components/FichaDetalleTabsNav';
import { fichaDetalleNoop, fichaDetalleNoopAsync } from './fichaDetalleNoop';
import { useFichaAprendices } from './hooks/useFichaAprendices';
import { useFichaDetalleData } from './hooks/useFichaDetalleData';
import { useFichaDetallePage } from './hooks/useFichaDetallePage';
import { useFichaInstructores } from './hooks/useFichaInstructores';
import type { FichaDetalleTab } from './types';

type Props = Readonly<{ fichaId: number; onClose: () => void }>;

/**
 * Muestra datos, instructores y aprendices de la ficha en el contexto actual.
 */
export function FichaDetalleEmbedded({ fichaId, onClose }: Props) {
  const [tab, setTab] = useState<FichaDetalleTab>('instructores');
  const data = useFichaDetalleData(fichaId);
  const aprendicesModel = useFichaAprendices(fichaId, data.loadFicha);
  const instructoresModel = useFichaInstructores({
    fichaId,
    ficha: data.ficha,
    diasFichaDisponibles: data.diasFichaDisponibles,
    loadFicha: data.loadFicha,
    reloadAgenda: fichaDetalleNoopAsync,
  });
  useFichaDetallePage({
    fichaId,
    isValidFichaId: data.isValidFichaId,
    tab,
    setLoading: data.setLoading,
    loadFicha: data.loadFicha,
    loadInstructores: instructoresModel.loadInstructores,
    loadAprendices: aprendicesModel.loadAprendices,
    loadPersonas: fichaDetalleNoopAsync,
  });

  if (data.loading) return <FichaDetalleLoadingState />;
  if (data.error || !data.ficha) {
    return (
      <div className="space-y-3 rounded-xl bg-white p-6 dark:bg-gray-800">
        <p className="text-sm text-red-600">{data.error || 'No se pudo cargar la ficha.'}</p>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ficha de caracterización</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ficha {data.ficha.ficha}</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-300">{data.ficha.programa_formacion_nombre || '—'}</p>
        </div>
        <button type="button" className="btn-secondary inline-flex items-center gap-1" onClick={onClose}>
          <XMarkIcon className="h-5 w-5" aria-hidden />
          Cerrar
        </button>
      </div>
      <FichaDetalleResumen ficha={data.ficha} diasLabel={data.diasLabel} puedeEditarFicha={false} />
      <FichaDetalleTabsNav tab={tab} setTab={setTab} puedeProgramarInstructores={false} />
      {tab === 'instructores' ? (
        <FichaDetalleInstructoresTab
          {...instructoresModel}
          puedeEditarFicha={false}
          puedeProgramarInstructores={false}
          onEditarFicha={fichaDetalleNoop}
        />
      ) : null}
      {tab === 'aprendices' ? (
        <FichaDetalleAprendicesTab {...aprendicesModel} puedeGestionarAprendices={false} />
      ) : null}
    </div>
  );
}
