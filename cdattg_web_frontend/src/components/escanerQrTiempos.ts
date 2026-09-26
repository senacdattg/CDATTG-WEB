/**
 * Tiempos del escáner QR. Los bajé porque 3 segundos trababan la fila de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */

/** No vuelvo a leer el mismo QR si sigue en el recuadro. */
export const DEBOUNCE_MISMO_QR_MS = 1200;

/** Tras registrar, reanudo la cámara casi de una. */
export const PAUSA_TRAS_ESCANEO_MS = 300;
