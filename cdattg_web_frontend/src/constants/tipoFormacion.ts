/** Tipos de formación de ficha (canónicos, alineados con el backend). */
export const TIPO_FORMACION = {
  REGULAR: 'FORMACION_REGULAR',
  MEDIA_TECNICA: 'MEDIA_TECNICA',
  COMPLEMENTARIA: 'FORMACION_COMPLEMENTARIA',
} as const;

export type TipoFormacion = (typeof TIPO_FORMACION)[keyof typeof TIPO_FORMACION];

export const TIPO_FORMACION_OPTIONS: ReadonlyArray<{ value: TipoFormacion; label: string }> = [
  { value: TIPO_FORMACION.REGULAR, label: 'Formación Regular' },
  { value: TIPO_FORMACION.MEDIA_TECNICA, label: 'Media Técnica' },
  { value: TIPO_FORMACION.COMPLEMENTARIA, label: 'Formación Complementaria' },
];

export function labelTipoFormacion(value?: string | null): string {
  const found = TIPO_FORMACION_OPTIONS.find((o) => o.value === value);
  return found?.label ?? 'Formación Regular';
}

export function normalizeTipoFormacion(value?: string | null): TipoFormacion {
  if (value === TIPO_FORMACION.MEDIA_TECNICA || value === TIPO_FORMACION.COMPLEMENTARIA) {
    return value;
  }
  return TIPO_FORMACION.REGULAR;
}
