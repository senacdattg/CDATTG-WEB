/**
 * @module pages/ficha-detalle/fichaDetalleNoop
 * @description Callbacks vacíos con identidad estable para overlays de solo lectura.
 * @author Cristian Deysdayr Jiménez
 */

/**
 * No hace nada. Misma referencia en cada import: evita bucles de useEffect.
 */
export function fichaDetalleNoop(): void {
  return undefined;
}

/**
 * Promesa vacía estable para loaders opcionales del detalle de ficha.
 * @returns Promesa resuelta sin valor.
 */
export async function fichaDetalleNoopAsync(): Promise<void> {
  return undefined;
}
