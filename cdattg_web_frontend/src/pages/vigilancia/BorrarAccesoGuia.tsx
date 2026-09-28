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
      <li>Cuenta cuántas visitas hay en el rango.</li>
      <li>Guarda la copia ZIP. Si cancelas, hay que volver a bajarla.</li>
      <li>Recién entonces aparece Borrar esas visitas. Confirma dos veces con ELIMINAR. No se borra a las personas.</li>
    </ol>
  );
}
