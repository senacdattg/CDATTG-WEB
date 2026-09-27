/**
 * Pido confirmación antes de cerrar muchas salidas.
 *
 * @author Cristian Deysdayr Jiménez
 */

type Props = Readonly<{
  aCerrar: number;
  excluidas: number;
  enviando: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}>;

/**
 * Muestro el recuento y dos botones claros.
 */
export function SalidaMasivaConfirmar({ aCerrar, excluidas, enviando, onCancelar, onConfirmar }: Props) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
      <p className="text-sm text-gray-800 dark:text-amber-100">
        Se registrará la salida de <strong>{aCerrar}</strong> personas, sin motivo.
        {excluidas > 0 ? ` ${excluidas} quedan adentro.` : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={enviando} onClick={onConfirmar}>
          {enviando ? 'Registrando…' : 'Confirmar salida'}
        </button>
        <button type="button" className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600" disabled={enviando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
