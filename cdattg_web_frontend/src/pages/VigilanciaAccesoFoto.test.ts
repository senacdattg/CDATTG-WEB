/**
 * Pruebo el enlace de la foto de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { debeMostrarFotoPorteria, urlFotoAcceso } from '../services/vigilanciaAccesoFoto';

describe('urlFotoAcceso', () => {
  it('arma la ruta con la cédula', () => {
    expect(urlFotoAcceso('1120955821')).toContain('/vigilancia/acceso/foto?documento=1120955821');
  });

  it('oculta el recuadro si no hay foto', () => {
    expect(debeMostrarFotoPorteria(false)).toBe(false);
    expect(debeMostrarFotoPorteria(true)).toBe(true);
  });
});
