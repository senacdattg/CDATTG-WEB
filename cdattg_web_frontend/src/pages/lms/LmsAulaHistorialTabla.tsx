/**
 * @module pages/lms/LmsAulaHistorialTabla
 * @description Tabla: un aprendiz y las actividades en columnas.
 * Lo hice para no repetir el nombre en vertical.
 * La uso en LmsAulaHistorial.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsAulaHistorialPersona } from './LmsAulaHistorialPersona';
import { armarMatrizHistorial } from './lmsHistorialMatriz';
import type { LmsHistorialFila } from '../../types/lms';

type Props = Readonly<{ fichaId: number; filas: LmsHistorialFila[] }>;

/**
 * El título de la actividad va arriba; la nota, debajo.
 */
export function LmsAulaHistorialTabla({ fichaId, filas }: Props) {
  const { columnas, personas } = armarMatrizHistorial(filas);
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800/80">
      <table className="min-w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
          <tr>
            <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left font-semibold dark:bg-gray-900/40">
              Aprendiz
            </th>
            {columnas.map((col) => (
              <th key={col.actividadId} className="min-w-[10rem] px-3 py-3 text-center font-semibold">
                {col.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {personas.map((persona) => (
            <LmsAulaHistorialPersona key={persona.aprendizId} fichaId={fichaId} persona={persona} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
