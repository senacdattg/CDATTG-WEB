/**
 * Une reporte, salida masiva, visitas y personas sin nombre.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useState } from 'react';
import { VigilanciaAccesoPanel } from '../VigilanciaAccesoPanel';
import { BorrarAccesoTab } from './BorrarAccesoTab';
import { PersonasSinNombreTab } from './PersonasSinNombreTab';
import { SalidaMasivaTab } from './SalidaMasivaTab';

type TabId = 'reporte' | 'salida' | 'borrar' | 'stubs';

const TABS: { id: TabId; texto: string }[] = [
  { id: 'reporte', texto: 'Reporte' },
  { id: 'salida', texto: 'Salida masiva' },
  { id: 'borrar', texto: 'Borrar registros' },
  { id: 'stubs', texto: 'Personas sin nombre' },
];

/**
 * Dejo elegir historial, sacar a todos o borrar visitas (no personas).
 */
export function VigilanciaAccesoPage() {
  const [tab, setTab] = useState<TabId>('reporte');
  return (
    <div>
      <div className="mx-auto max-w-7xl pb-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Reporte de accesos">
          {TABS.map((b) => {
            const activo = tab === b.id;
            const clase = activo
              ? 'rounded-full bg-green-700 px-4 py-1.5 text-sm font-semibold text-white'
              : 'rounded-full border border-gray-300 bg-white px-4 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200';
            return (
              <button key={b.id} type="button" role="tab" aria-selected={activo} className={clase} onClick={() => setTab(b.id)}>
                {b.texto}
              </button>
            );
          })}
        </div>
      </div>
      {tab === 'reporte' ? <VigilanciaAccesoPanel /> : null}
      {tab === 'salida' ? <SalidaMasivaTab /> : null}
      {tab === 'borrar' ? <BorrarAccesoTab /> : null}
      {tab === 'stubs' ? <PersonasSinNombreTab /> : null}
    </div>
  );
}
