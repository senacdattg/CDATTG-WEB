/**
 * Tope de espera de red en portería para no clavar el escáner.
 *
 * @author Cristian Deysdayr Jiménez
 */

/** Si el lookup no responde en este tiempo, uso lo guardado aquí. */
export const TOPE_LOOKUP_MS = 2000;

/** Entrada o salida: si tarda más, la dejo en cola. */
export const TOPE_REGISTRO_MS = 3000;

/** Lista de adentro: si tarda, muestro la última lista. */
export const TOPE_DENTRO_MS = 2500;

/**
 * Corto la promesa si la red se demora.
 * @param trabajo lo que espero del servidor
 * @param ms tope
 */
export function conTope<T>(trabajo: Promise<T>, ms: number): Promise<T> {
  return new Promise((ok, fail) => {
    const t = globalThis.setTimeout(() => fail(new Error('La red tardó demasiado.')), ms);
    trabajo.then(
      (v) => {
        globalThis.clearTimeout(t);
        ok(v);
      },
      (e: unknown) => {
        globalThis.clearTimeout(t);
        fail(e);
      },
    );
  });
}

/** ¿El navegador dice que hay red? */
export function hayRed(): boolean {
  return navigator.onLine !== false;
}
