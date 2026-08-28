/**
 * @module pages/lms/LmsAuditoriaNota
 * @description Nota y comentario que el instructor dejó en la entrega.
 * @author Cristian Deysdayr Jiménez
 */

type Props = Readonly<{ calificacion: number | null; comentario: string }>;

/**
 * Solo lectura: auditoría de lo que calificó el instructor.
 */
export function LmsAuditoriaNota({ calificacion, comentario }: Props) {
  return (
    <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
      <p>Nota del instructor: {calificacion ?? 'Sin nota'}</p>
      {comentario ? <p>Comentario del instructor: {comentario}</p> : null}
    </div>
  );
}
