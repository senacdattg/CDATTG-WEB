/**
 * Pestaña para borrar visitas de portería, no personas, con ZIP previo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import type { RegionalItem, SedeItem } from '../../types';
import { axiosErrorMessage } from '../../utils/httpError';
import { BorrarAccesoBotonera } from './BorrarAccesoBotonera';
import { BorrarAccesoFiltros } from './BorrarAccesoFiltros';
import { BorrarAccesoGuia } from './BorrarAccesoGuia';
import { hayRangoFechas, hoyISO } from './borrarAccesoFrase';
import { paramsBorrar } from './borrarAccesoParams';
import { avisoAccesoAviso, avisoAccesoError, avisoAccesoOk } from './vigilanciaAccesoAvisos';
import { guardarZipRespaldo } from './guardarZipRespaldo';
import { CAJA_VIG, PAGINA_VIG, SUB_VIG, TITULO_VIG } from './vigilanciaUi';

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
    if (!hayRangoFechas(fechaDesde, fechaHasta)) {
      setError('Falta una fecha.');
      return;
    }
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
      if (blob.type.includes('json')) {
        setError('No se pudo armar el ZIP.');
        avisoAccesoError('No se pudo armar el ZIP.');
        return;
      }
      const r = await guardarZipRespaldo(blob, 'registros-acceso-porteria.zip');
      if (r === 'guardado') {
        setDescargaOk(true);
        avisoAccesoOk('Copia ZIP lista', 'Ya puede borrar esas visitas.');
      } else if (r === 'pendiente_confirmar') setZipPendiente(true);
      else {
        setError('Cancelaste el guardado. Vuelve a descargar y pulsa Guardar.');
        avisoAccesoAviso('ZIP cancelado', 'Si canceló Guardar, baje de nuevo la copia.');
      }
    } catch (e: unknown) {
      const msg = axiosErrorMessage(e, 'No se pudo descargar el ZIP.');
      setError(msg);
      avisoAccesoError(msg);
    }
  };

  const eliminar = async () => {
    if (!descargaOk) {
      setError('Hay que guardar el ZIP antes de eliminar.');
      return;
    }
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
      avisoAccesoOk('Visitas borradas', `${res.eliminados} salieron del historial. Las personas siguen.`);
      setPaso(0); setDescargaOk(false); setZipPendiente(false); setC1(''); setC2('');
      const otra = await apiService.accesoHistorial(paramsBorrar(regionalId, sedeId, fechaDesde, fechaHasta));
      setTotal(otra.total);
    } catch (e: unknown) {
      const msg = axiosErrorMessage(e, 'No se pudieron eliminar los registros.');
      setError(msg);
      avisoAccesoError(msg);
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
        <BorrarAccesoBotonera
          total={total} loading={loading} descargaOk={descargaOk} zipPendiente={zipPendiente}
          paso={paso} c1={c1} c2={c2} enviando={enviando} error={error} ok={ok}
          onConsultar={() => void consultar()} onZip={() => void bajarZip()} onPaso1={() => setPaso(1)}
          onC1={setC1} onC2={setC2} onPaso2={() => setPaso(2)}
          onCancelar={() => {
            setPaso(0); setDescargaOk(false); setZipPendiente(false); setC1(''); setC2('');
            avisoAccesoAviso('Borrado cancelado', 'No se quitó ninguna visita.');
          }}
          onEliminar={() => void eliminar()} onMarcarZip={setDescargaOk} />
      </section>
    </div>
  );
}
