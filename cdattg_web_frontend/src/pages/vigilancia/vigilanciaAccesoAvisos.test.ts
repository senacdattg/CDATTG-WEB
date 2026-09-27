/**
 * Compruebo que los avisos llaman al toast de la app.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it, vi } from 'vitest';
import { mostrarToastApp } from '../../utils/appToast';
import { avisoAccesoAviso, avisoAccesoError, avisoAccesoInfo, avisoAccesoOk } from './vigilanciaAccesoAvisos';

vi.mock('../../utils/appToast', () => ({
  mostrarToastApp: vi.fn(),
}));

describe('vigilanciaAccesoAvisos', () => {
  it('avisa éxito', () => {
    avisoAccesoOk('Listo', 'Hecho');
    expect(mostrarToastApp).toHaveBeenCalledWith({ icon: 'success', titulo: 'Listo', texto: 'Hecho' });
  });

  it('avisa error', () => {
    avisoAccesoError('Fallo');
    expect(mostrarToastApp).toHaveBeenCalledWith({ icon: 'error', titulo: 'No se pudo', texto: 'Fallo' });
  });

  it('avisa info y alerta', () => {
    avisoAccesoInfo('Dato', 'Cero');
    avisoAccesoAviso('Ojo', 'Falta ZIP');
    expect(mostrarToastApp).toHaveBeenCalledWith({ icon: 'info', titulo: 'Dato', texto: 'Cero' });
    expect(mostrarToastApp).toHaveBeenCalledWith({ icon: 'warning', titulo: 'Ojo', texto: 'Falta ZIP' });
  });
});
