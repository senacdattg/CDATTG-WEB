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
import { avisoAccesoError, avisoAccesoOk } from './vigilanciaAccesoAvisos';
import { BARRA_HERR, CAJA_VIG, ERR_VIG, OK_VIG, PAGINA_VIG, SUB_VIG, TITULO_VIG } from './vigilanciaUi';

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
      const msg = axiosErrorMessage(e, 'No se pudieron cargar las sedes.');
      setError(msg);
      avisoAccesoError(msg);
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
      avisoAccesoError('No se pudo listar quién está adentro.');
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
      avisoAccesoOk('Salida registrada', `Salieron ${res.cerradas}. Quedan ${res.quedan}.`);
    } catch (e: unknown) {
      const msg = axiosErrorMessage(e, 'No se pudo registrar la salida masiva.');
      setError(msg);
      avisoAccesoError(msg);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className={PAGINA_VIG}>
      <header>
        <h1 className={TITULO_VIG}>Salida masiva</h1>
        <p className={SUB_VIG}>
          Pulse Quedarse en quien debe seguir adentro. Si no lo pulsa, sale.
        </p>
      </header>
      <section className={CAJA_VIG}>
        <label htmlFor="masiva-sede" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Sede</label>
        <select id="masiva-sede" className="input-field w-full max-w-md" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
          <option value="">Seleccionar sede</option>
          {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        {sedeId ? (
          <>
            <div className={`${BARRA_HERR} mt-4`}>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {loading ? 'Cargando…' : `${dentro.length} adentro · ${aCerrar} salen · ${excluir.size} se quedan`}
              </p>
              {aCerrar > 0 && !confirmar ? (
                <button type="button" className="btn-primary" onClick={() => setConfirmar(true)}>
                  Registrar salida de {aCerrar}
                </button>
              ) : null}
            </div>
            {confirmar ? (
              <div className="mb-4">
                <SalidaMasivaConfirmar aCerrar={aCerrar} excluidas={excluir.size} enviando={enviando} onCancelar={() => setConfirmar(false)} onConfirmar={() => void ejecutar()} />
              </div>
            ) : null}
            {error ? <p className={ERR_VIG}>{error}</p> : null}
            {ok ? <p className={OK_VIG}>Salieron {ok.cerradas}. Quedan {ok.quedan}.</p> : null}
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Pulse Quedarse para dejarlo adentro. Vuelva a pulsar si se equivocó.
            </p>
            <input className="input-field mt-3 w-full max-w-md" placeholder="Buscar por nombre o documento" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="mt-3">
              <SalidaMasivaLista items={visibles} excluir={excluir} onToggle={(id) => setExcluir((prev) => toggleExcluir(prev, id))} />
            </div>
          </>
        ) : <p className="mt-3 text-sm text-gray-500">Elija una sede para ver quién está adentro.</p>}
        {!sedeId && error ? <p className={ERR_VIG}>{error}</p> : null}
      </section>
    </div>
  );
}
