/** Normaliza tipo Sofía (etiqueta o código) a código corto para Fase 2. */
const ETIQUETA_A_CODIGO: Record<string, string> = {
  'CEDULA DE CIUDADANIA': 'CC',
  'CÉDULA DE CIUDADANÍA': 'CC',
  'CEDULA DE EXTRANJERIA': 'CE',
  'CÉDULA DE EXTRANJERÍA': 'CE',
  'TARJETA DE IDENTIDAD': 'TI',
  'PERMISO ESPECIAL DE PERMANENCIA': 'PEP',
  'PERMISO POR PROTECCION TEMPORAL': 'PPT',
  'PERMISO POR PROTECCIÓN TEMPORAL': 'PPT',
  'DNI - DOCUMENTO NACIONAL DE IDENTIFICACION': 'DNI',
  'DNI - DOCUMENTO NACIONAL DE IDENTIFICACIÓN': 'DNI',
  'NUMERO CIEGO SENA': 'NCS',
  'NÚMERO CIEGO SENA': 'NCS',
  PASAPORTE: 'PAS',
};

export function tipoSofiaACodigo(tipo: string | undefined | null): string {
  const raw = (tipo ?? '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (['CC', 'TI', 'CE', 'PEP', 'PPT', 'DNI', 'NCS', 'PAS'].includes(upper)) {
    return upper;
  }
  const sinAcentos = upper
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return ETIQUETA_A_CODIGO[upper] ?? ETIQUETA_A_CODIGO[sinAcentos] ?? raw;
}
