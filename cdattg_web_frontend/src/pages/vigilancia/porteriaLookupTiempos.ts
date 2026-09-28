/**
 * Tiempos de la búsqueda de portería (teclado y láser en el mismo recuadro).
 * Lo hice para no consultar a mitad de cédula. La cámara no usa esto: busca al leer.
 *
 * @author Cristian Deysdayr Jiménez
 */

/** Ignoro el mismo documento si acaba de consultarse (láser + Enter a la vez). */
export const DEBOUNCE_MISMO_DOC_MS = 800;

/**
 * Tras la última tecla espero 3 s y recién ahí busco solo.
 * Enter, Buscar y la cámara no esperan este tiempo.
 */
export const AUTO_LOOKUP_MS = 3000;
