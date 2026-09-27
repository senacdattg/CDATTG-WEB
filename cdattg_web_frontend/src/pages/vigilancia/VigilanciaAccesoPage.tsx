/**
 * Une reporte, salida masiva, visitas y personas sin nombre.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { VigilanciaAccesoPanel } from '../VigilanciaAccesoPanel';
import { BorrarAccesoTab } from './BorrarAccesoTab';
import { PersonasSinNombreTab } from './PersonasSinNombreTab';
import { SalidaMasivaTab } from './SalidaMasivaTab';
import { puedeBorrarRegistrosAcceso, tabsAccesoVisibles, type TabAccesoId } from './vigilanciaAccesoTabs';

/**
 * Dejo elegir historial, sacar a todos o borrar visitas (no personas).
 */
export function VigilanciaAccesoPage() {
  const { hasPermission } = useAuth();
  const puedeBorrar = puedeBorrarRegistrosAcceso(hasPermission);
  const tabs = useMemo(() => tabsAccesoVisibles(puedeBorrar), [puedeBorrar]);
  const [tab, setTab] = useState<TabAccesoId>('reporte');
  const tabOk = tabs.some((t) => t.id === tab) ? tab : 'reporte';

  return (
    <div>
      <div className="mx-auto max-w-7xl pb-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Reporte de accesos">
          {tabs.map((b) => {
            const activo = tabOk === b.id;
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
      {tabOk === 'reporte' ? <VigilanciaAccesoPanel /> : null}
      {tabOk === 'salida' ? <SalidaMasivaTab /> : null}
      {tabOk === 'borrar' && puedeBorrar ? <BorrarAccesoTab /> : null}
      {tabOk === 'stubs' ? <PersonasSinNombreTab /> : null}
    </div>
  );
}
