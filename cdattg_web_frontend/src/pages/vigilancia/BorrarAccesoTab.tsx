/**
 * Pestaña para borrar visitas de portería, no personas, con ZIP previo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import type { AccesoHistorialParams, RegionalItem, SedeItem } from '../../types';
import { axiosErrorMessage } from '../../utils/httpError';
import { BorrarAccesoConfirmar } from './BorrarAccesoConfirmar';
import { BorrarAccesoFiltros } from './BorrarAccesoFiltros';
import { BorrarAccesoGuia } from './BorrarAccesoGuia';
import { hayRangoFechas, hoyISO } from './borrarAccesoFrase';
import { AvisoZipManual, btnZip } from './BorrarAccesoZipUi';
import { guardarZipRespaldo } from './guardarZipRespaldo';
import { CAJA_VIG, ERR_VIG, OK_VIG, PAGINA_VIG, SUB_VIG, TITULO_VIG } from './vigilanciaUi';

function paramsBorrar(regionalId: string, sedeId: string, desde: string, hasta: string): AccesoHistorialParams {
  const p: AccesoHistorialParams = { page: 1, page_size: 1 };
  if (regionalId) p.regional_id = Number(regionalId);
  if (sedeId) p.sede_id = Number(sedeId);
  if (desde) p.fecha_desde = desde;
  if (hasta) p.fecha_hasta = hasta;
  return p;
}

export function BorrarAccesoTab() {
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [regionalId, setRegionalId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [fechaDesde, setFechaDesde] = useState(hoyISO());
  const [fechaHasta, setFechaHasta] = useState(hoyISO());
  const [total, setTotal] = useState<number | null>(null);
  const [descargaOk, setDescargaOk] = useState(false);
  const [zipPendiente, setZipPendiente] = useState(false);
  const [paso, setPaso] = useState<0 | 1 | 2>(0);
  const [c1, setC1] = useState('');
  const [c2, setC2] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([apiService.getCatalogosRegionales(), apiService.getCatalogosSedes()])
      .then(([r, s]) => { setRegionales(r ?? []); setSedes(s ?? []); })
      .catch((e: unknown) => setError(axiosErrorMessage(e, 'No se pudieron cargar catálogos.')));
  }, []);

  const resetRespaldo = () => {
    setDescargaOk(false); setZipPendiente(false); setPaso(0); setC1(''); setC2(''); setOk(''); setTotal(null);
  };

  const consultar = async () => {
    if (!hayRangoFechas(fechaDesde, fechaHasta)) { setError('Falta una fecha.'); return; }
    setLoading(true); setError(''); setOk('');
    try {
      const res = await apiService.accesoHistorial(paramsBorrar(regionalId, sedeId, fechaDesde, fechaHasta));
      setTotal(res.total); setDescargaOk(false); setZipPendiente(false); setPaso(0);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo contar los registros.'));
    } finally { setLoading(false); }
  };

  const bajarZip = async () => {
    setError(''); setDescargaOk(false); setZipPendiente(false);
    try {
      const blob = await apiService.accesoZipRegistros(paramsBorrar(regionalId, sedeId, fechaDesde, fechaHasta));
      if (blob.type.includes('json')) { setError('No se pudo armar el ZIP.'); return; }
      const r = await guardarZipRespaldo(blob, 'registros-acceso-porteria.zip');
      if (r === 'guardado') setDescargaOk(true);
      else if (r === 'pendiente_confirmar') setZipPendiente(true);
      else setError('Cancelaste el guardado. Vuelve a descargar y pulsa Guardar.');
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo descargar el ZIP.'));
    }
  };

  const eliminar = async () => {
    if (!descargaOk) { setError('Hay que guardar el ZIP antes de eliminar.'); return; }
    setEnviando(true); setError('');
    try {
      const res = await apiService.accesoBorrarRegistros({
        regional_id: regionalId ? Number(regionalId) : undefined,
        sede_id: sedeId ? Number(sedeId) : undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        descarga_ok: true,
        confirmacion_1: c1,
        confirmacion_2: c2,
      });
      setOk(`Se quitaron ${res.eliminados} visitas. Las personas siguen en el sistema.`);
      setPaso(0); setDescargaOk(false); setZipPendiente(false); setC1(''); setC2('');
      const otra = await apiService.accesoHistorial(paramsBorrar(regionalId, sedeId, fechaDesde, fechaHasta));
      setTotal(otra.total);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudieron eliminar los registros.'));
    } finally { setEnviando(false); }
  };

  return (
    <div className={PAGINA_VIG}>
      <header>
        <h1 className={TITULO_VIG}>Borrar registros de acceso</h1>
        <p className={SUB_VIG}>Se quitan visitas de portería, no personas.</p>
        <BorrarAccesoGuia />
      </header>
      <section className={CAJA_VIG}>
        <BorrarAccesoFiltros regionales={regionales} sedes={sedes} regionalId={regionalId} sedeId={sedeId}
          fechaDesde={fechaDesde} fechaHasta={fechaHasta}
          onRegional={(v) => { setRegionalId(v); resetRespaldo(); }}
          onSede={(v) => { setSedeId(v); resetRespaldo(); }}
          onDesde={(v) => { setFechaDesde(v); resetRespaldo(); }}
          onHasta={(v) => { setFechaHasta(v); resetRespaldo(); }} />
        {total === null ? null : (
          <p className="mt-3 text-sm">{total} visitas</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={loading} onClick={() => void consultar()}>{loading ? 'Contando...' : 'Consultar'}</button>
          {total !== null && total > 0 ? (
            <button type="button" aria-pressed={descargaOk} className={btnZip(descargaOk)} onClick={() => void bajarZip()}>Descargar ZIP</button>
          ) : null}
          {descargaOk && total !== null && total > 0 && paso === 0 ? (
            <button type="button" className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white" onClick={() => setPaso(1)}>Eliminar</button>
          ) : null}
        </div>
        <AvisoZipManual descargaOk={descargaOk} zipPendiente={zipPendiente} onMarcar={setDescargaOk} />
        {paso === 1 || paso === 2 ? (
          <div className="mt-4">
            <BorrarAccesoConfirmar paso={paso} total={total ?? 0} c1={c1} c2={c2} enviando={enviando}
              onC1={setC1} onC2={setC2} onPaso2={() => setPaso(2)}
              onCancelar={() => { setPaso(0); setDescargaOk(false); setZipPendiente(false); setC1(''); setC2(''); }}
              onEliminar={() => void eliminar()} />
          </div>
        ) : null}
        {error ? <p className={ERR_VIG}>{error}</p> : null}
        {ok ? <p className={OK_VIG}>{ok}</p> : null}
      </section>
    </div>
  );
}
