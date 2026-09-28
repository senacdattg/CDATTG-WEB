/**
 * Fechas de la carga retroactiva: cualquier día pasado, no hoy.
 *
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Armo YYYY-MM-DD con el calendario local.
 * @param d Fecha
 * @returns Texto para el campo date
 */
export function fechaLocalISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Ayer: tope máximo del selector. */
export function ayerISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fechaLocalISO(d);
}

/** Último lunes a viernes anterior a hoy. */
export function ultimoDiaHabilISO(): string {
  const d = new Date();
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return fechaLocalISO(d);
}

/** Diez años atrás: el calendario no corta a 30 días. */
export function minFechaRetroISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 10);
  return fechaLocalISO(d);
}
