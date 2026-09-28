/**
 * Pestaña para borrar del sistema a quien solo tiene un número, sin nombre.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../../services/api';
import type { AccesoStubItem } from '../../types';
import { axiosErrorMessage } from '../../utils/httpError';
import { PaginadorAcceso } from './PaginadorAcceso';
import { PersonasSinNombreConfirmar } from './PersonasSinNombreConfirmar';
import { TAM_PAGINA_DENTRO, totalHojas } from './paginarLista';
import { conTodosDeHoja, hojaTodaMarcada, idsDeHoja, textoMarcarHoja, toggleId } from './personasSinNombreSel';
import { avisoAccesoError, avisoAccesoOk } from './vigilanciaAccesoAvisos';
import {
  BARRA_HERR, BTN_ROJO, BTN_SEL, CAJA_VIG, DOC_MONO, ERR_VIG, FILA_OFF, FILA_ON,
  LABEL_CHK, LISTA_DIV, OK_VIG, PAGINA_VIG, SUB_VIG, TITULO_VIG,
} from './vigilanciaUi';

export function PersonasSinNombreTab() {
  const [items, setItems] = useState<AccesoStubItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [paso, setPaso] = useState<0 | 1 | 2>(0);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const avisoRef = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async (p: number) => {
    setLoading(true); setError('');
    try {
      const res = await apiService.accesoPersonasSinNombre(p, TAM_PAGINA_DENTRO);
      setItems(res.items ?? []); setTotal(res.total); setPagina(res.page);
      setSel(new Set()); setPaso(0);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudieron listar.'));
      avisoAccesoError('No se pudieron listar las personas sin nombre.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void cargar(1); }, [cargar]);
  useEffect(() => {
    if (paso === 0) return;
    avisoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [paso]);

  const idsHoja = useMemo(() => idsDeHoja(items), [items]);
  const todosHoja = hojaTodaMarcada(sel, idsHoja);
  const docsSel = items.filter((it) => sel.has(it.id)).map((it) => it.numero_documento);

  const eliminar = async () => {
    if (sel.size === 0) return;
    setEnviando(true); setError('');
    try {
      const res = await apiService.accesoBorrarPersonasSinNombre([...sel], true);
      setOk(`Se quitaron ${res.eliminados} del sistema. No queda registro.`);
      avisoAccesoOk('Fuera del sistema', `Se borraron ${res.eliminados}. No queda visita ni usuario.`);
      setPaso(0); setSel(new Set());
      await cargar(1);
    } catch (e: unknown) {
      const msg = axiosErrorMessage(e, 'No se pudieron eliminar.');
      setError(msg);
      avisoAccesoError(msg);
    } finally { setEnviando(false); }
  };

  const onAceptar = () => {
    if (paso === 1) { setPaso(2); return; }
    void eliminar();
  };

  const hojas = totalHojas(total, TAM_PAGINA_DENTRO);

  return (
    <div className={PAGINA_VIG}>
      <header>
        <h1 className={TITULO_VIG}>Eliminar personas sin nombre</h1>
        <p className={SUB_VIG}>
          Solo números digitados por error en portería. Se borra la persona, el usuario y las visitas. De menor a mayor.
        </p>
      </header>
      <section className={CAJA_VIG}>
        <div className={BARRA_HERR}>
          <p className="text-sm font-medium">{total} sin nombre / {sel.size} elegidas</p>
          <div className="flex flex-wrap gap-2">
            {items.length > 0 ? (
              <button type="button" className={BTN_SEL} onClick={() => setSel((p) => conTodosDeHoja(p, idsHoja))}>
                {textoMarcarHoja(todosHoja)}
              </button>
            ) : null}
            <button type="button" className="btn-secondary" disabled={loading} onClick={() => void cargar(pagina)}>Actualizar lista</button>
            <button type="button" className={BTN_ROJO} disabled={sel.size === 0 || paso !== 0} onClick={() => setPaso(1)}>
              Borrar elegidas del sistema
            </button>
          </div>
        </div>
        {error ? <p className={ERR_VIG}>{error}</p> : null}
        {ok ? <p className={OK_VIG}>{ok}</p> : null}
        {paso === 1 || paso === 2 ? (
          <div ref={avisoRef} className="mb-4">
            <PersonasSinNombreConfirmar paso={paso} docs={docsSel} enviando={enviando} onAceptar={onAceptar} onCancelar={() => setPaso(0)} />
          </div>
        ) : null}
        {loading ? <p className="text-sm text-primary-600">Cargando...</p> : null}
        {loading || items.length > 0 ? null : (
          <p className="text-sm text-gray-500">No hay personas sin nombre.</p>
        )}
        {items.length > 0 ? (
          <ul className={LISTA_DIV}>
              {items.map((it) => {
                const on = sel.has(it.id);
                return (
                  <li key={it.id} className={on ? FILA_ON : FILA_OFF}>
                    <label className={LABEL_CHK}>
                      <input type="checkbox" checked={on} onChange={() => setSel((p) => toggleId(p, it.id))} />
                      <span className={DOC_MONO}>{it.numero_documento}</span>
                    </label>
                    <span className="text-xs text-gray-400">sin nombre</span>
                  </li>
                );
              })}
            </ul>
        ) : null}
        <PaginadorAcceso pagina={pagina} totalHojas={hojas} onPagina={(p) => { void cargar(p); }} />
      </section>
    </div>
  );
}
