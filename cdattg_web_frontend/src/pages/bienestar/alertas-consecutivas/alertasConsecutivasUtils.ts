import type { AlertaConsecutivaItem, FichaCaracterizacionResponse } from '../../../types';

export type GrupoAlertasPorFicha = {
  ficha_numero: string;
  programa_nombre: string;
  sede_nombre: string;
  jornada_nombre?: string;
  instructor_nombre?: string;
  ambiente_nombre?: string;
  modalidad_formacion_nombre?: string;
  alertas: AlertaConsecutivaItem[];
  activas: number;
  groupKey: string;
};

export function agruparAlertasPorFicha(alertas: AlertaConsecutivaItem[]): GrupoAlertasPorFicha[] {
  const grupos = alertas.reduce<Record<string, Omit<GrupoAlertasPorFicha, 'groupKey'>>>(
    (acc, alerta) => {
      const key = `${alerta.ficha_numero}||${alerta.sede_nombre || ''}`;
      if (!acc[key]) {
        acc[key] = {
          ficha_numero: alerta.ficha_numero,
          programa_nombre: alerta.programa_nombre || '',
          sede_nombre: alerta.sede_nombre,
          jornada_nombre: alerta.jornada_nombre,
          instructor_nombre: alerta.instructor_nombre,
          ambiente_nombre: alerta.ambiente_nombre,
          modalidad_formacion_nombre: alerta.modalidad_formacion_nombre,
          alertas: [],
          activas: 0,
        };
      }
      acc[key].alertas.push(alerta);
      if (alerta.racha_activa) acc[key].activas += 1;
      return acc;
    },
    {},
  );
  return Object.entries(grupos).map(([groupKey, group]) => ({ ...group, groupKey }));
}

export function grupoAlertasToFichaCard(grupo: GrupoAlertasPorFicha): FichaCaracterizacionResponse {
  return {
    id: 0,
    programa_formacion_id: 0,
    ficha: grupo.ficha_numero,
    programa_formacion_nombre: grupo.programa_nombre,
    sede_nombre: grupo.sede_nombre,
    jornada_nombre: grupo.jornada_nombre,
    instructor_nombre: grupo.instructor_nombre,
    ambiente_nombre: grupo.ambiente_nombre,
    modalidad_formacion_nombre: grupo.modalidad_formacion_nombre,
    cantidad_aprendices: grupo.alertas.length,
    status: true,
  };
}

export function programasUnicosDesdeGruposAlertas(grupos: GrupoAlertasPorFicha[]): string[] {
  const set = new Set<string>();
  for (const g of grupos) {
    const nombre = g.programa_nombre?.trim();
    if (nombre) set.add(nombre);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function filtrarGruposAlertas(
  grupos: GrupoAlertasPorFicha[],
  searchQuery: string,
  programaNombre: string,
): GrupoAlertasPorFicha[] {
  const q = searchQuery.trim().toLowerCase();
  const programa = programaNombre.trim();
  return grupos.filter((g) => {
    if (programa && g.programa_nombre !== programa) return false;
    if (!q) return true;
    return g.ficha_numero.toLowerCase().includes(q) || (g.programa_nombre || '').toLowerCase().includes(q);
  });
}

export function filtrarAlertasAprendiz(
  alertas: AlertaConsecutivaItem[],
  searchQuery: string,
): AlertaConsecutivaItem[] {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return alertas;
  return alertas.filter(
    (a) =>
      a.numero_documento.toLowerCase().includes(q) || a.persona_nombre.toLowerCase().includes(q),
  );
}

export function alertasDeFicha(
  alertas: AlertaConsecutivaItem[],
  fichaNumero: string,
  sedeNombreParam: string,
): AlertaConsecutivaItem[] {
  return alertas.filter(
    (a) =>
      a.ficha_numero === fichaNumero &&
      (!sedeNombreParam || (a.sede_nombre || '') === sedeNombreParam),
  );
}

export function textoAprendicesConRacha(n: number): string {
  if (n === 1) return '1 aprendiz con 2 faltas seguidas';
  return `${n} aprendices con 2 faltas seguidas`;
}

/** Racha más reciente de fechas de calendario consecutivas (YYYY-MM-DD). */
export function rachaCalendarioDesdeFechas(fechas: string[]): string[] {
  const unique = [...new Set(fechas.map((f) => f.slice(0, 10)).filter(Boolean))].sort();
  let best: string[] = [];
  let current: string[] = [];
  for (const fecha of unique) {
    if (current.length === 0) {
      current = [fecha];
      continue;
    }
    const prev = Date.parse(`${current[current.length - 1]}T12:00:00`);
    const next = Date.parse(`${fecha}T12:00:00`);
    if (Number.isFinite(prev) && Number.isFinite(next) && next - prev === 86_400_000) {
      current.push(fecha);
      continue;
    }
    if (current.length >= 2) best = current;
    current = [fecha];
  }
  if (current.length >= 2) best = current;
  return best;
}
