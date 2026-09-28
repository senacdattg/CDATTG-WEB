/**
 * Botones Anterior y Siguiente, igual que el historial de accesos.
 *
 * @author Cristian Deysdayr Jiménez
 */
type Props = Readonly<{
  pagina: number;
  totalHojas: number;
  onPagina: (p: number) => void;
}>;

const CAJA = 'mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-700';
const TEXTO = 'text-sm text-gray-500';
const FILA = 'flex gap-2';

/**
 * Solo los muestro si hay más de una hoja.
 */
/**
 * Solo los muestro si hay más de una hoja.
 */
export function PaginadorAcceso({ pagina, totalHojas, onPagina }: Props) {
  if (totalHojas <= 1) return null;
  return (
    <div className={CAJA}>
      <p className={TEXTO}>
        Página {pagina} de {totalHojas}
      </p>
      <div className={FILA}>
        <button type="button" className="btn-secondary" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
          Anterior
        </button>
        <button type="button" className="btn-secondary" disabled={pagina >= totalHojas} onClick={() => onPagina(pagina + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}
