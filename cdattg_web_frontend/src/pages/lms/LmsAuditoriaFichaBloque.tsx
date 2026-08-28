/**
 * @module pages/lms/LmsAuditoriaFichaBloque
 * @description Carpeta de ficha, entregas, nota y comentario del instructor.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsArchivosEntrega } from './LmsArchivosEntrega';
import type { LmsAuditoriaFichaItem } from '../../types/lmsAuditoria';

type Props = Readonly<{ ficha: LmsAuditoriaFichaItem }>;

/**
 * Una ficha con PDFs y lo que calificó el instructor.
 */
export function LmsAuditoriaFichaBloque({ ficha }: Props) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{ficha.nombre_carpeta}</h2>
      {ficha.actividades.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Aún no hay actividades cargadas en esta ficha.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {ficha.actividades.map((a) => (
            <li key={a.entrega_id}>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100">{a.titulo}</h3>
              <LmsArchivosEntrega
                fichaId={a.ficha_id}
                actividadId={a.actividad_id}
                entregaId={a.entrega_id}
                archivos={a.archivos}
                vacio="Sin archivos."
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
