/**
 * Compruebo las etiquetas de estado del reporte.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { claseEstadoVisita, textoEstadoVisita } from './accesoEstadoVisita';

describe('accesoEstadoVisita', () => {
  it('nombra abierto, cancelado y cerrado', () => {
    expect(textoEstadoVisita('abierto')).toBe('Dentro');
    expect(textoEstadoVisita('cancelado')).toBe('Cancelado');
    expect(textoEstadoVisita('otro')).toBe('Cerrado');
  });

  it('pinta abierto distinto de cerrado', () => {
    expect(claseEstadoVisita('abierto')).toContain('emerald');
    expect(claseEstadoVisita('cerrado')).toContain('gray');
  });
});
