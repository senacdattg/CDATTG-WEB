/**
 * Doble validación antes de borrar visitas: aviso y dos frases.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { FRASE_BORRAR_ACCESO, puedeConfirmarBorrar } from './borrarAccesoFrase';

type Props = Readonly<{
  paso: 1 | 2;
  total: number;
  c1: string;
  c2: string;
  enviando: boolean;
  onC1: (v: string) => void;
  onC2: (v: string) => void;
  onPaso2: () => void;
  onCancelar: () => void;
  onEliminar: () => void;
}>;

/**
 * Primero aviso; después pido ELIMINAR dos veces.
 */
export function BorrarAccesoConfirmar({
  paso, total, c1, c2, enviando, onC1, onC2, onPaso2, onCancelar, onEliminar,
}: Props) {
  if (paso === 1) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
        <p className="text-sm">
          Se van a quitar <strong>{total}</strong> visitas de portería. Las personas siguen en el sistema.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={onPaso2}>Continuar</button>
          <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={onCancelar}>Cancelar</button>
        </div>
      </div>
    );
  }
  const listo = puedeConfirmarBorrar(c1, c2);
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
      <p className="text-sm">Escribe <strong>{FRASE_BORRAR_ACCESO}</strong> en las dos cajas.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input className="input-field" aria-label="Primera palabra ELIMINAR" value={c1} onChange={(e) => onC1(e.target.value)} placeholder={FRASE_BORRAR_ACCESO} />
        <input className="input-field" aria-label="Segunda palabra ELIMINAR" value={c2} onChange={(e) => onC2(e.target.value)} placeholder={FRASE_BORRAR_ACCESO} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={!listo || enviando} onClick={onEliminar}>
          {enviando ? 'Eliminando…' : 'Eliminar'}
        </button>
        <button type="button" className="rounded-lg border px-4 py-2 text-sm" disabled={enviando} onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}
