/**
 * @module pages/lms/LmsAulaHistorialPersona
 * @description Una fila: el nombre y la nota de cada actividad.
 * Lo pongo debajo del título de la columna.
 * Lo usa LmsAulaHistorialTabla.
 * @author Cristian Deysdayr Jiménez
 */
import { Link } from 'react-router-dom';
import { lmsPaths } from '../../routes/paths';
import { lmsStateDesdeHistorial } from './lmsHistorialTab';
import { textoNotaHistorial } from './lmsHistorialTexto';
import type { LmsHistorialPersona } from './lmsHistorialMatriz';

type Props = Readonly<{ fichaId: number; persona: LmsHistorialPersona }>;

/**
 * El clic en la nota abre esa entrega.
 */
export function LmsAulaHistorialPersona({ fichaId, persona }: Props) {
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
          {nota ? (
            <Link
              to={lmsPaths.actividadEntrega(fichaId, nota.actividad_id, nota.aprendiz_id)}
              state={lmsStateDesdeHistorial()}
              className="text-primary-700 hover:underline dark:text-primary-300"
            >
              {textoNotaHistorial(nota.calificacion, nota.calificacion_max)}
            </Link>
          ) : (
            '—'
          )}
        </td>
      ))}
    </tr>
  );
}
