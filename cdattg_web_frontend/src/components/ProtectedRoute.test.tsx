/**
 * @module components/ProtectedRoute.test
 * @description Sin sesión, el sistema abre el portal público.
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { rutaPublicaDeEntrada } from './ProtectedRoute';
import { portalPaths } from '../routes/paths';

describe('rutaPublicaDeEntrada', () => {
  it('es el portal publico', () => {
    expect(rutaPublicaDeEntrada()).toBe(portalPaths.index);
    expect(rutaPublicaDeEntrada()).toBe('/');
  });
});
