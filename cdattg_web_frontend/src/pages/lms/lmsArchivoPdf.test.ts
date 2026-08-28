/**
 * @module pages/lms/lmsArchivoPdf.test
 * @description Validación de PDF en entregas del aprendiz.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { esPdfNombre, mensajeArchivosNoPdf } from './lmsArchivoPdf';

describe('esPdfNombre', () => {
  it('acepta pdf en cualquier capitalización', () => {
    expect(esPdfNombre('tarea.PDF')).toBe(true);
    expect(esPdfNombre('tarea.docx')).toBe(false);
  });
});

describe('mensajeArchivosNoPdf', () => {
  it('rechaza el primero que no es pdf', () => {
    expect(mensajeArchivosNoPdf([{ name: 'ok.pdf' }, { name: 'foto.png' }])).toBe('Solo se admite PDF: foto.png');
  });

  it('acepta solo pdf', () => {
    expect(mensajeArchivosNoPdf([{ name: 'ev.pdf' }])).toBeNull();
  });
});
