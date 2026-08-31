import { describe, expect, it } from 'vitest';
import { escapeXml, nombreArchivoListaAprendices } from './exportAprendicesListaSenaDocx';

describe('exportAprendicesListaSenaDocx', () => {
  it('escapa caracteres XML', () => {
    expect(escapeXml('A & B <C> "D"')).toBe('A &amp; B &lt;C&gt; &quot;D&quot;');
  });

  it('genera nombre de archivo seguro', () => {
    expect(nombreArchivoListaAprendices('3406451')).toBe('lista_aprendices_ficha_3406451.docx');
    expect(nombreArchivoListaAprendices('ficha/2024')).toBe('lista_aprendices_ficha_ficha_2024.docx');
  });
});
