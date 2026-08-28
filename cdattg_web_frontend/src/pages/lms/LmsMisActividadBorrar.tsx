/**
 * @module pages/lms/LmsMisActividadBorrar
 * @description Segunda fase: confirmar si de verdad se elimina.
 * @author Cristian Deysdayr Jiménez
 */
type Props = Readonly<{
  titulo: string;
  saving: boolean;
  onConfirmar: () => Promise<void>;
  onCancelar: () => void;
}>;

/**
 * El primer clic fue Eliminar en la lista. Aquí pide estar seguro.
 */
export function LmsMisActividadBorrar({ titulo, saving, onConfirmar, onCancelar }: Props) {
  return (
    <section className="rounded-xl border border-red-200 bg-white p-4 shadow-sm dark:border-red-900/60 dark:bg-gray-800 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">¿Eliminar esta actividad?</h2>
      <p className="mt-2 break-words text-sm text-gray-600 dark:text-gray-300">
        Va a quitar «{titulo}» y también las entregas de los aprendices. Esta acción no se puede deshacer.
      </p>
      <p className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" className="btn-secondary w-full" disabled={saving} onClick={onCancelar}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn-primary w-full bg-red-600 hover:bg-red-700"
          disabled={saving}
          onClick={() => void onConfirmar()}
        >
          {saving ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
      </p>
    </section>
  );
}
