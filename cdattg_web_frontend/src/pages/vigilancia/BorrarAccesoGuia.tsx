/**
 * Explico cómo borrar visitas de portería, no personas.
 *
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Dejo el procedimiento arriba para que se sepa el orden.
 */
export function BorrarAccesoGuia() {
  return (
    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
      <li>Consulta cuántas visitas hay en el rango.</li>
      <li>Descarga el ZIP y elige dónde guardarlo. Si cancelas, hay que volver a descargar.</li>
      <li>Recién entonces aparece Eliminar. Confirma dos veces con la palabra ELIMINAR. No se borra a las personas, solo las visitas.</li>
    </ol>
  );
}
