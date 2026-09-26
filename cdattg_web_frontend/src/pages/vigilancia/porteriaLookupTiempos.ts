/**
 * Tiempos de la búsqueda de portería (láser y teclado).
 * Lo hice porque había 3 s de espera antes de consultar, y el vigilante
 * creía que el servidor tardaba. La cámara no usa esto: llama al lookup al leer.
 *
 * @author Cristian Deysdayr Jiménez
 */

/** Ignoro el mismo documento si acaba de consultarse (láser + Enter a la vez). */
export const DEBOUNCE_MISMO_DOC_MS = 800;

/**
 * Espera tras la última tecla antes de buscar solo.
 * El láser deja todos los dígitos en un instante; 400 ms alcanza y no se siente como 3 s.
 */
export const AUTO_LOOKUP_MS = 400;
