/**
 * Dos pasos Aceptar / Cancelar antes de borrar personas del sistema.
 *
 * @author Cristian Deysdayr Jiménez
 */
type Props = Readonly<{
  paso: 1 | 2;
  docs: string[];
  enviando: boolean;
  onAceptar: () => void;
  onCancelar: () => void;
}>;

const CAJA_1 = 'rounded-xl border p-4 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40';
const CAJA_2 = 'rounded-xl border p-4 border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40';
const TEXTO = 'text-sm text-gray-800 dark:text-gray-100';
const FILA = 'mt-3 flex flex-wrap gap-2';
const BTN_OK = 'rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white';
const BTN_NO = 'rounded-lg border px-4 py-2 text-sm';

/**
 * Armo el texto del aviso según el paso.
 */
function textoPaso(paso: 1 | 2, docs: string[]): string {
  const n = docs.length;
  const muestra = docs.slice(0, 8).join(', ');
  const extra = n > 8 ? ` y ${n - 8} mas` : '';
  if (paso === 1) {
    return `Van a desaparecer ${n} persona(s) del sistema (documento ${muestra}${extra}). No queda visita ni usuario.`;
  }
  return 'Ultima confirmacion: se borra del todo. No se puede deshacer.';
}

/**
 * Primero aviso; luego ultima confirmacion. Sin escribir frases.
 */
export function PersonasSinNombreConfirmar({ paso, docs, enviando, onAceptar, onCancelar }: Props) {
  const caja = paso === 1 ? CAJA_1 : CAJA_2;
  const etiqueta = enviando ? 'Eliminando...' : 'Aceptar';
  return (
    <div className={caja}>
      <p className={TEXTO}>{textoPaso(paso, docs)}</p>
      <div className={FILA}>
        <button type="button" className={BTN_OK} disabled={enviando} onClick={onAceptar}>
          {etiqueta}
        </button>
        <button type="button" className={BTN_NO} disabled={enviando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
