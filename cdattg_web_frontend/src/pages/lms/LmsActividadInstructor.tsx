/**
 * @module pages/lms/LmsActividadInstructor
 * @description Listado de envíos para calificar.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { LmsEntregaFila } from './LmsEntregaFila';
import type { LmsActividadDetalle } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  detalle: LmsActividadDetalle;
  saving: boolean;
  onCalificar: (entregaId: number, nota: number | null, comentario: string) => Promise<void>;
}>;

/**
 * Revisión de trabajos cargados por los aprendices.
 */
export function LmsActividadInstructor({ fichaId, detalle, saving, onCalificar }: Props) {
  const puntos = detalle.calificacion_max ?? 100;
  const vacio = detalle.entregas.length === 0;
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Entregas de aprendices</h2>
        <p className="text-sm text-gray-500">Descargue el trabajo, asigne nota de 0 a {puntos} y deje un comentario.</p>
      </header>
      {vacio ? (
        <p className="text-sm text-gray-500">No hay aprendices en esta ficha.</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
          {detalle.entregas.map((e) => (
            <li key={`${e.aprendiz_id}-${e.id}`} className="py-4">
              <LmsEntregaFila
                fichaId={fichaId}
                actividadId={detalle.id}
                puntos={puntos}
                entrega={e}
                saving={saving}
                onCalificar={onCalificar}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
