/**
 * Pestaña para sacar a todos los que siguen adentro, salvo los que se marquen.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';
import type { AccesoDentroItem, AccesoSalidaMasivaResponse, SedeItem } from '../../types';
import { axiosErrorMessage } from '../../utils/httpError';
import { SalidaMasivaConfirmar } from './SalidaMasivaConfirmar';
import { SalidaMasivaLista } from './SalidaMasivaLista';
import { filtrarDentro, toggleExcluir, visitasACerrar } from './salidaMasivaIds';

/**
 * Cargo la sede, listo a quienes están y cierro la salida masiva.
 */
export function SalidaMasivaTab() {
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [sedeId, setSedeId] = useState('');
  const [dentro, setDentro] = useState<AccesoDentroItem[]>([]);
  const [excluir, setExcluir] = useState<Set<number>>(new Set());
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState<AccesoSalidaMasivaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    apiService.getCatalogosSedes().then((s) => setSedes(s ?? [])).catch((e: unknown) => {
      setError(axiosErrorMessage(e, 'No se pudieron cargar las sedes.'));
    });
  }, []);

  const cargar = useCallback(async (sid: string) => {
    if (!sid) { setDentro([]); return; }
    setLoading(true);
    setError('');
    try {
      const list = await apiService.accesoListDentro(Number(sid));
      setDentro(list ?? []);
      setExcluir(new Set());
      setConfirmar(false);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo listar quién está adentro.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOk(null);
    void cargar(sedeId);
  }, [sedeId, cargar]);

  const visibles = useMemo(() => filtrarDentro(dentro, q), [dentro, q]);
  const ids = useMemo(() => dentro.map((d) => d.visita_id), [dentro]);
  const aCerrar = visitasACerrar(ids, excluir).length;

  const ejecutar = async () => {
    setEnviando(true);
    setError('');
    try {
      const res = await apiService.accesoSalidaMasiva(Number(sedeId), [...excluir]);
      setConfirmar(false);
      await cargar(sedeId);
      setOk(res);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo registrar la salida masiva.'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Salida masiva</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Cierra los ingresos abiertos de la sede. No pide motivo. Marca a quien debe quedar adentro.
        </p>
      </header>
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
        <label htmlFor="masiva-sede" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sede</label>
        <select id="masiva-sede" className="input-field w-full max-w-md" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
          <option value="">Seleccionar sede</option>
          {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        {sedeId ? (
          <>
            <input className="input-field mt-3 w-full max-w-md" placeholder="Buscar por nombre o documento" value={q} onChange={(e) => setQ(e.target.value)} />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {loading ? 'Cargando…' : `${dentro.length} adentro · ${aCerrar} salen · ${excluir.size} quedan`}
            </p>
            <div className="mt-2"><SalidaMasivaLista items={visibles} excluir={excluir} onToggle={(id) => setExcluir((prev) => toggleExcluir(prev, id))} /></div>
            {aCerrar > 0 && !confirmar ? (
              <button type="button" className="btn-primary mt-4" onClick={() => setConfirmar(true)}>Registrar salida de {aCerrar}</button>
            ) : null}
            {confirmar ? (
              <div className="mt-4">
                <SalidaMasivaConfirmar aCerrar={aCerrar} excluidas={excluir.size} enviando={enviando} onCancelar={() => setConfirmar(false)} onConfirmar={() => void ejecutar()} />
              </div>
            ) : null}
          </>
        ) : <p className="mt-3 text-sm text-gray-500">Elija una sede para ver quién está adentro.</p>}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="mt-3 text-sm text-emerald-700">Salieron {ok.cerradas}. Quedan {ok.quedan}.</p> : null}
      </section>
    </div>
  );
}
