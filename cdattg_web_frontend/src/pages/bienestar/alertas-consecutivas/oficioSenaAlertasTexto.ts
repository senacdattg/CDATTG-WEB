import { formatFechaLarga, formatFechaVista, hoyISOColombia } from '../../../utils/formatFecha';

export const CIUDAD_OFICIO = 'San José del Guaviare';
export const CENTRO_NOMBRE =
  'Centro de Desarrollo Agroindustrial Turístico y Tecnológico del Guaviare';
export const CODIGO_FORMATO = 'GD-F-008 V.07';
export const PIE_DIRECCION =
  'Dirección Carrera 19c No. 16-48, Ciudad San José. — PBX 57 601 5461500';

export const DESTINATARIO_COMITE =
  'Coordinación Académica / Comité de Evaluación y Seguimiento';
export const DESTINATARIO_BIENESTAR = 'Bienestar al Aprendiz — CDATTG';

export type TipoOficioAlerta = 'alerta_retencion' | 'desercion';

export type DestinatariosOficio = Readonly<{
  para: string;
  paraCargo: string;
  copia: string;
}>;

export type DatosOficioAlerta = Readonly<{
  aprendizId: number;
  aprendizNombre: string;
  numeroDocumento: string;
  programaNombre: string;
  fichaNumero: string;
  sedeNombre: string;
  totalInasistencias: number;
  fechasRacha: string[];
  rachaActiva: boolean;
  periodoEtiqueta: string;
  generadorNombre: string;
  generadorCargo: string;
  fechaOficioIso: string;
}>;

export function tipoOficio(diasRacha: number): TipoOficioAlerta {
  return diasRacha >= 3 ? 'desercion' : 'alerta_retencion';
}

export function etiquetaBotonOficio(diasRacha: number): string {
  return tipoOficio(diasRacha) === 'desercion' ? 'Oficio de deserción' : 'Oficio de alerta';
}

export function cargoGeneradorDesdeRoles(roles: string[]): string {
  const set = new Set(roles.map((r) => r.trim().toUpperCase()));
  if (set.has('BIENESTAR AL APRENDIZ')) return 'Bienestar al Aprendiz';
  if (set.has('INSTRUCTOR')) return 'Instructor';
  if (set.has('SUPER ADMINISTRADOR')) return 'Superadministrador';
  return 'Funcionario CDATTG';
}

export function listarFechasOficio(fechas: string[]): string {
  const vistas = fechas.map((f) => formatFechaVista(f)).filter((f) => f && f !== '—');
  const ultima = vistas.at(-1);
  if (!ultima) return 'sin fechas registradas';
  if (vistas.length === 1) return ultima;
  const anteriores = vistas.slice(0, -1).join(', ');
  return `${anteriores} y ${ultima}`;
}

export function encabezadoCiudadFecha(fechaIso: string = hoyISOColombia()): string {
  const raw = formatFechaLarga(fechaIso);
  const coma = raw.indexOf(', ');
  const fecha = coma >= 0 ? raw.slice(coma + 2) : raw;
  return `${CIUDAD_OFICIO}, ${fecha}`;
}

export function sanitizarNombreArchivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replaceAll(/\p{M}/gu, '')
    .replaceAll(/[^\w.-]+/g, '_')
    .replaceAll(/_+/g, '_')
    .replaceAll(/^_|_$/g, '')
    .slice(0, 80);
}

export function nombreArchivoOficio(aprendizNombre: string, ficha: string, fechaIso: string): string {
  const nombre = sanitizarNombreArchivo(aprendizNombre);
  const fichaSafe = sanitizarNombreArchivo(ficha);
  const fecha = fechaIso.slice(0, 10);
  return `oficio_inasistencias_ficha_${fichaSafe}_${nombre}_${fecha}.pdf`;
}

function identificacionAprendiz(d: DatosOficioAlerta): string {
  const programa = d.programaNombre.trim() || 'no registrado en el sistema';
  const sede = d.sedeNombre.trim() ? `, sede ${d.sedeNombre.trim()}` : '';
  return `el (la) aprendiz ${d.aprendizNombre}, identificado(a) con documento de identidad No. ${d.numeroDocumento}, matriculado(a) en el programa de formación ${programa}, ficha ${d.fichaNumero}${sede}`;
}

export function asuntoOficio(d: DatosOficioAlerta): string {
  if (tipoOficio(d.fechasRacha.length) === 'desercion') {
    return 'Asunto: Solicitud de deserción por inasistencias continuas injustificadas.';
  }
  return 'Asunto: Alerta por dos (2) inasistencias consecutivas sin justificar y solicitud de retención del aprendiz.';
}

export function destinatariosOficio(d: DatosOficioAlerta): DestinatariosOficio {
  if (tipoOficio(d.fechasRacha.length) === 'desercion') {
    return {
      para: DESTINATARIO_COMITE,
      paraCargo: CENTRO_NOMBRE,
      copia: d.aprendizNombre,
    };
  }
  return {
    para: d.aprendizNombre,
    paraCargo: 'Aprendiz SENA',
    copia: DESTINATARIO_BIENESTAR,
  };
}

function parrafosAlertaRetencion(d: DatosOficioAlerta, fechas: string, diasRacha: number): string[] {
  return [
    `Por medio del presente oficio me permito notificarle que, de conformidad con los registros de asistencia del Sistema de Información CDATTG, ${identificacionAprendiz(d)} presenta un total de ${d.totalInasistencias} inasistencia(s) sin justificar en el período analizado (${d.periodoEtiqueta}).`,
    `De dicho total se identifica una racha de ${diasRacha} día(s) de formación consecutivos sin asistencia efectiva ni justificación, correspondiente(s) a ${fechas}. Esta situación constituye alerta temprana por dos (2) inasistencias consecutivas.`,
    'Lo anterior configura incumplimiento injustificado, de acuerdo con el artículo 29 del Acuerdo 009 de 2024 (Reglamento del Aprendiz SENA), al no reportarse ni justificarse las inasistencias ante el instructor dentro de los cinco (5) días hábiles siguientes a su ocurrencia, conforme a los plazos del artículo 28 del mismo Acuerdo.',
    'Se advierte que el artículo 30, literal a), del Acuerdo 009 de 2024 establece que, en formación presencial, tener tres (3) días continuos de inasistencia injustificada constituye deserción por inasistencias al proceso de formación. Un tercer día continuo configuraría esa causal.',
    `En consecuencia, se solicita al equipo de Bienestar al Aprendiz del ${CENTRO_NOMBRE} activar la estrategia de retención y acompañamiento del (la) aprendiz, a fin de prevenir la deserción.`,
    'Asimismo, se requiere que el (la) aprendiz se presente ante el instructor o Bienestar al Aprendiz, con los soportes a que haya lugar, a más tardar dentro de los cinco (5) días hábiles siguientes a la notificación de este oficio.',
  ];
}

function parrafosDesercion(d: DatosOficioAlerta, fechas: string, diasRacha: number): string[] {
  return [
    `Por medio del presente oficio me permito reportar que, de conformidad con los registros de asistencia del Sistema de Información CDATTG, ${identificacionAprendiz(d)} presenta un total de ${d.totalInasistencias} inasistencia(s) sin justificar en el período analizado (${d.periodoEtiqueta}).`,
    `Se identifica una racha de ${diasRacha} día(s) continuos de formación sin asistencia efectiva ni justificación, correspondiente(s) a ${fechas}.`,
    'Esta situación configura incumplimiento injustificado, de acuerdo con el artículo 29 del Acuerdo 009 de 2024, al no reportarse ni justificarse las inasistencias en los términos del artículo 28 del mismo Acuerdo.',
    'El artículo 30, literal a), del Acuerdo 009 de 2024 establece que, en la formación presencial, excepto la complementaria, tener tres (3) días continuos de inasistencia injustificada constituye deserción por inasistencias al proceso de formación.',
    'En consecuencia, se solicita a la Coordinación Académica y al Comité de Evaluación y Seguimiento, conforme al artículo 31 del Acuerdo 009 de 2024, iniciar el trámite de deserción por inasistencias continuas, con garantía del debido proceso.',
  ];
}

export function parrafosOficio(d: DatosOficioAlerta): string[] {
  const fechas = listarFechasOficio(d.fechasRacha);
  const diasRacha = d.fechasRacha.length;
  if (tipoOficio(diasRacha) === 'desercion') {
    return parrafosDesercion(d, fechas, diasRacha);
  }
  return parrafosAlertaRetencion(d, fechas, diasRacha);
}