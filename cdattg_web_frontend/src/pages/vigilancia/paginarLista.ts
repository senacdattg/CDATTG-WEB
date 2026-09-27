/**
 * Parto listas largas en hojas, como el reporte de accesos.
 *
 * @author Cristian Deysdayr Jiménez
 */
export const TAM_PAGINA_DENTRO = 50;

/**
 * Recorto la hoja actual. Si la página no existe, uso la 1.
 */
export function hojaDe<T>(items: readonly T[], pagina: number, tam: number): T[] {
  const t = Math.max(1, tam);
  const total = totalHojas(items.length, t);
  const p = Math.min(total, Math.max(1, pagina));
  const desde = (p - 1) * t;
  return items.slice(desde, desde + t);
}

/**
 * Cuántas hojas hay. Tam 0 o negativo lo trato como 1.
 */
export function totalHojas(n: number, tam: number): number {
  if (n <= 0) return 1;
  return Math.ceil(n / Math.max(1, tam));
}
