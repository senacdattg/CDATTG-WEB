/**
 * Cuando vuelve la red, envío la cola. Si ya estaba adentro, mando salida.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { apiService } from '../../services/api';
import type { ColaAccesoItem } from './porteriaColaTipos';
import { leerCola, quitarCola } from './porteriaMemoria';
import { esIngresoAbierto, esSinIngresoAbierto } from './porteriaReglaAcceso';

async function enviarUno(item: ColaAccesoItem): Promise<void> {
  const base = {
    numero_documento: item.numero_documento,
    metodo_registro: item.metodo_registro,
    sede_id: item.sede_id,
  };
  if (item.tipo === 'INGRESO') {
    try {
      await apiService.accesoIngreso(base);
    } catch (e: unknown) {
      if (!esIngresoAbierto(e)) throw e;
      await apiService.accesoSalida(base);
    }
    return;
  }
  try {
    await apiService.accesoSalida({ ...base, permitir_sin_ingreso: item.permitir_sin_ingreso });
  } catch (e: unknown) {
    if (!esSinIngresoAbierto(e)) throw e;
    await apiService.accesoSalida({ ...base, permitir_sin_ingreso: true });
  }
}

/**
 * Mando cada movimiento. Si uno falla de verdad, paro para no desordenar.
 */
export async function sincronizarColaPorteria(): Promise<void> {
  const cola = await leerCola();
  for (const item of cola) {
    try {
      await enviarUno(item);
      await quitarCola(item.id);
    } catch {
      return;
    }
  }
}
