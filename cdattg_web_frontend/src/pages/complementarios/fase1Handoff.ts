import type { VerificarAspiranteResponse } from '../../types';
import { tipoSofiaACodigo } from './sofiaTipo';

export const FASE1_HANDOFF_KEY = 'sofia_fase1_handoff_v1';

export type Fase1HandoffDoc = {
  numero_documento: string;
  tipo_documento: string;
  nombre?: string;
  nombres?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
};

export type Fase1HandoffPayload = {
  createdAt: string;
  documentos: Fase1HandoffDoc[];
};

export function documentosRegistradosParaFase2(
  resultados: VerificarAspiranteResponse[],
): Fase1HandoffDoc[] {
  return resultados
    .filter((r) => r.estado === 'REGISTRADO')
    .map((r) => ({
      numero_documento: r.numero_documento,
      tipo_documento: tipoSofiaACodigo(r.tipo_encontrado),
      nombre: r.nombre,
      nombres: r.nombres,
      primer_apellido: r.primer_apellido,
      segundo_apellido: r.segundo_apellido,
    }))
    .filter((d) => d.numero_documento && d.tipo_documento);
}

export function guardarHandoffFase1(documentos: Fase1HandoffDoc[]): void {
  const payload: Fase1HandoffPayload = {
    createdAt: new Date().toISOString(),
    documentos,
  };
  sessionStorage.setItem(FASE1_HANDOFF_KEY, JSON.stringify(payload));
}

export function leerHandoffFase1(): Fase1HandoffPayload | null {
  try {
    const raw = sessionStorage.getItem(FASE1_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Fase1HandoffPayload;
    if (!Array.isArray(parsed.documentos) || parsed.documentos.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function limpiarHandoffFase1(): void {
  sessionStorage.removeItem(FASE1_HANDOFF_KEY);
}
