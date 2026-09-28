/**
 * Biblioteca mira los carnets regulares que el instructor líder ya validó.
 * Oculto fichas terminadas en el API. Aquí marco listos si tengo permiso.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { listarCarnetsBiblioteca, marcarCarnetBibliotecaListo } from '../../../services/carnetApi';
import type { CarnetBibliotecaItem, CarnetBibliotecaResponse } from '../../../types/carnet';
import { CarnetBibliotecaEstadoFiltro } from './CarnetBibliotecaEstadoFiltro';
import { CarnetBibliotecaFila } from './CarnetBibliotecaFila';
import { CarnetBibliotecaFiltro } from './CarnetBibliotecaFiltro';
import { CarnetBibliotecaFotoDialog } from './CarnetBibliotecaFotoDialog';
import { filtrarItemsBiblioteca, filtrarItemsListo, type FiltroListoBiblioteca } from './carnetBiblioteca';
import { descargarExcelBiblioteca } from './carnetBibliotecaExcel';
import { descargarFotosBibliotecaZip } from './carnetBibliotecaZip';

const PERM_MARCAR_LISTO = 'MARCAR CARNET BIBLIOTECA';

/**
 * Cargo el catálogo, filtro por ficha y listo las personas.
 */
export function CarnetBibliotecaPage() {
  const { hasPermission } = useAuth();
  const puedeMarcar = hasPermission(PERM_MARCAR_LISTO);
  const [data, setData] = useState<CarnetBibliotecaResponse>({ fichas: [], items: [] });
  const [fichaId, setFichaId] = useState(0);
  const [filtroListo, setFiltroListo] = useState<FiltroListoBiblioteca>('todos');
  const [error, setError] = useState('');
  const [ver, setVer] = useState<CarnetBibliotecaItem | null>(null);
  const visibles = filtrarItemsListo(filtrarItemsBiblioteca(data.items, fichaId), filtroListo);

  useEffect(() => {
    void listarCarnetsBiblioteca()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
  }, []);

  const marcar = async (item: CarnetBibliotecaItem, listo: boolean) => {
    try {
      await marcarCarnetBibliotecaListo(item.id, listo);
      setData((prev) => ({
        ...prev,
        items: prev.items.map((it) => (it.id === item.id ? { ...it, listo } : it)),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Carnets regulares</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Solo formación regular vigente. Aquí están los aprendices cuyo instructor líder ya validó el carnet.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <CarnetBibliotecaFiltro fichas={data.fichas} items={data.items} fichaId={fichaId} onChange={setFichaId} />
      <CarnetBibliotecaEstadoFiltro valor={filtroListo} onChange={setFiltroListo} />
      <div className="flex gap-2">
        <button type="button" className="btn-sena flex-1" disabled={visibles.length === 0} onClick={() => void descargarExcelBiblioteca(fichaId)}>
          Descargar Excel
        </button>
        <button type="button" className="btn-sena flex-1" disabled={visibles.length === 0} onClick={() => void descargarFotosBibliotecaZip(fichaId)}>
          Descargar fotos (ZIP)
        </button>
      </div>
      {visibles.length === 0 ? (
        <p className="text-sm text-gray-500">
          {fichaId <= 0 ? 'Seleccione una ficha para ver los carnets.' : 'No hay carnets validados en esta ficha.'}
        </p>
      ) : null}
      <ul className="space-y-3">
        {visibles.map((item) => (
          <li key={item.id}>
            <CarnetBibliotecaFila item={item} puedeMarcar={puedeMarcar} onVerFoto={setVer} onMarcarListo={(it, l) => void marcar(it, l)} />
          </li>
        ))}
      </ul>
      {ver ? (
        <CarnetBibliotecaFotoDialog id={ver.id} nombre={`${ver.nombres} ${ver.apellidos}`.trim()} onClose={() => setVer(null)} />
      ) : null}
    </main>
  );
}
