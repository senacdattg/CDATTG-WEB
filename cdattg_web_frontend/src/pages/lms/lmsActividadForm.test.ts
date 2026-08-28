/**
 * @module pages/lms/lmsActividadForm.test
 * @description Validación de alta y edición de actividad LMS.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { buildActividadFormData, errorActividadForm, etiquetasActividadForm } from './lmsActividadForm';
import { LMS_MAX_BYTES_ARCHIVO } from './lmsArchivoLimite';

const base = {
  titulo: 'Guía 1',
  cuerpo: 'Leer',
  puntos: '80',
  fecha: '2026-08-30',
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

  it('exige plazo de entrega', () => {
    expect(errorActividadForm({ ...base, fecha: '' })).toBe('El plazo de entrega es obligatorio');
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
  it('siempre envía el plazo', () => {
    const body = buildActividadFormData({ ...base, hora: '18:00' });
    expect(body.get('titulo')).toBe('Guía 1');
    expect(body.get('plazo_entrega')).toBe('2026-08-30T18:00');
  });
});

describe('etiquetasActividadForm', () => {
  it('distingue publicar y editar', () => {
    expect(etiquetasActividadForm(false, false).boton).toBe('Publicar actividad');
    expect(etiquetasActividadForm(true, true).boton).toBe('Guardando…');
  });
});
