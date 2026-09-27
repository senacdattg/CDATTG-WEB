/**
 * Botones de contar, ZIP y borrar visitas, con la confirmación.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { BorrarAccesoConfirmar } from './BorrarAccesoConfirmar';
import { AvisoZipManual, btnZip } from './BorrarAccesoZipUi';
import { ERR_VIG, OK_VIG } from './vigilanciaUi';

type Props = Readonly<{
  total: number | null;
  loading: boolean;
  descargaOk: boolean;
  zipPendiente: boolean;
  paso: 0 | 1 | 2;
  c1: string;
  c2: string;
  enviando: boolean;
  error: string;
  ok: string;
  onConsultar: () => void;
  onZip: () => void;
  onPaso1: () => void;
  onC1: (v: string) => void;
  onC2: (v: string) => void;
  onPaso2: () => void;
  onCancelar: () => void;
  onEliminar: () => void;
  onMarcarZip: (v: boolean) => void;
}>;

/**
 * Pinto la barra de acciones del borrado de visitas.
 */
export function BorrarAccesoBotonera(p: Props) {
  const hay = p.total !== null && p.total > 0;
  return (
    <>
      {p.total === null ? null : <p className="mt-3 text-sm">{p.total} visitas</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={p.loading} onClick={p.onConsultar}>
          {p.loading ? 'Contando...' : 'Contar visitas'}
        </button>
        {hay ? (
          <button type="button" aria-pressed={p.descargaOk} className={btnZip(p.descargaOk)} onClick={p.onZip}>
            {p.descargaOk ? 'Copia ZIP lista' : 'Guardar copia ZIP'}
          </button>
        ) : null}
        {p.descargaOk && hay && p.paso === 0 ? (
          <button type="button" className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white" onClick={p.onPaso1}>Borrar esas visitas</button>
        ) : null}
      </div>
      <AvisoZipManual descargaOk={p.descargaOk} zipPendiente={p.zipPendiente} onMarcar={p.onMarcarZip} />
      {p.paso === 1 || p.paso === 2 ? (
        <div className="mt-4">
          <BorrarAccesoConfirmar paso={p.paso} total={p.total ?? 0} c1={p.c1} c2={p.c2} enviando={p.enviando}
            onC1={p.onC1} onC2={p.onC2} onPaso2={p.onPaso2} onCancelar={p.onCancelar} onEliminar={p.onEliminar} />
        </div>
      ) : null}
      {p.error ? <p className={ERR_VIG}>{p.error}</p> : null}
      {p.ok ? <p className={OK_VIG}>{p.ok}</p> : null}
    </>
  );
}
