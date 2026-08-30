/**
 * @module pages/lms/LmsAulaHistorialPersona
 * @description Una fila: el nombre y la nota de cada actividad.
 * Lo pongo debajo del título de la columna.
 * Lo usa LmsAulaHistorialTabla.
 * @author Cristian Deysdayr Jiménez
 */
import { textoNotaHistorial } from './lmsHistorialTexto';
import type { LmsHistorialPersona } from './lmsHistorialMatriz';

type Props = Readonly<{ fichaId: number; persona: LmsHistorialPersona }>;

/**
 * El nombre una vez y la nota de cada actividad.
 */
export function LmsAulaHistorialPersona({ persona }: Props) {
  return (
    <tr className="border-t border-gray-100 dark:border-gray-700">
      <th
        scope="row"
        className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 text-left font-medium text-gray-900 dark:bg-gray-800 dark:text-white"
      >
        {persona.nombre || '—'}
      </th>
      {persona.notas.map((nota, i) => (
        <td key={nota?.actividad_id ?? i} className="px-3 py-3 text-center">
          {nota ? textoNotaHistorial(nota.calificacion, nota.calificacion_max) : '—'}
        </td>
      ))}
    </tr>
  );
}
