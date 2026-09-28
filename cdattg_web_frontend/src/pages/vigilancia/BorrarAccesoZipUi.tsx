/**
 * Aviso y estilo del botón ZIP de borrar visitas.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { FILA_CHK } from './vigilanciaUi';

type Props = Readonly<{
  descargaOk: boolean;
  zipPendiente: boolean;
  onMarcar: (v: boolean) => void;
}>;

/**
 * Solo si el guardado quedó a medias pido que confirmen el ZIP a mano.
 */
export function AvisoZipManual({ descargaOk, zipPendiente, onMarcar }: Props) {
  if (descargaOk || !zipPendiente) return null;
  return (
    <label className={FILA_CHK}>
      <input type="checkbox" onChange={(e) => onMarcar(e.target.checked)} />
      <span>Ya guardé el ZIP. Si cancelé Guardar, no marco esto.</span>
    </label>
  );
}

/**
 * Verde cuando el ZIP ya está guardado.
 */
export function btnZip(activo: boolean): string {
  if (activo) return 'rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white';
  return 'rounded-lg border px-4 py-2 text-sm';
}
