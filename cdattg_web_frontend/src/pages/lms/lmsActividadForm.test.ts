/**
 * @module pages/lms/lmsActividadForm.test
 * @description Validación de alta y edición de actividad LMS.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { buildActividadFormData, errorActividadForm, etiquetasActividadForm } from './lmsActividadForm';
import { LMS_MAX_BYTES_ARCHIVO } from './lmsArchivoLimite';

const base = {
  titulo: 'Guía 1',
  cuerpo: 'Leer',
  puntos: '80',
  conPlazo: false,
  fecha: '',
  hora: '23:00',
  files: [] as File[],
};

describe('errorActividadForm', () => {
  it('exige título', () => {
    expect(errorActividadForm({ ...base, titulo: '  ' })).toBe('El título es obligatorio');
  });

  it('exige puntos 0-100', () => {
    expect(errorActividadForm({ ...base, puntos: '120' })).toBe('Los puntos deben estar entre 0 y 100');
  });

  it('exige fecha si hay plazo', () => {
    expect(errorActividadForm({ ...base, conPlazo: true, fecha: '' })).toBe('Indique la fecha de entrega');
  });

  it('acepta un formulario válido', () => {
    expect(errorActividadForm(base)).toBe('');
  });

  it('rechaza archivo mayor a 10 MB', () => {
    const files = [{ name: 'grande.pdf', size: LMS_MAX_BYTES_ARCHIVO + 1 }] as File[];
    expect(errorActividadForm({ ...base, files })).toContain('grande.pdf');
  });
});

describe('buildActividadFormData', () => {
  it('incluye plazo solo si está marcado', () => {
    const con = buildActividadFormData({ ...base, conPlazo: true, fecha: '2026-08-30', hora: '18:00' });
    expect(con.get('titulo')).toBe('Guía 1');
    expect(con.get('plazo_entrega')).toBe('2026-08-30T18:00');
    expect(buildActividadFormData(base).get('plazo_entrega')).toBeNull();
  });
});

describe('etiquetasActividadForm', () => {
  it('distingue publicar y editar', () => {
    expect(etiquetasActividadForm(false, false).boton).toBe('Publicar en el tablón');
    expect(etiquetasActividadForm(true, true).boton).toBe('Guardando…');
  });
});
