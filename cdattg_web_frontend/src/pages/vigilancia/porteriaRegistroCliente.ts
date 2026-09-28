/**
 * Registro entrada o salida: si la red falla, lo dejo en cola.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { apiService } from '../../services/api';
import type { AccesoLookupResponse, AccesoMetodoRegistro, AccesoRegistroResponse } from '../../types';
import { idColaAcceso, type ColaAccesoItem } from './porteriaColaTipos';
import { empujarCola } from './porteriaMemoria';
import { esFalloDeRed } from './porteriaErrorRed';
import { esIngresoAbierto, esSinIngresoAbierto } from './porteriaReglaAcceso';
import { registroLocal } from './porteriaLookupLocal';
import { conTope, hayRed, TOPE_REGISTRO_MS } from './porteriaTiemposRed';

type IngresoIn = {
  numero_documento: string;
  metodo_registro: string;
  sede_id: number;
};

type SalidaIn = IngresoIn & { permitir_sin_ingreso?: boolean };

async function encolar(item: Omit<ColaAccesoItem, 'id' | 'creado_en'>): Promise<void> {
  const creado_en = Date.now();
  await empujarCola({ ...item, id: idColaAcceso(creado_en), creado_en });
}

/**
 * Intento el servidor; si no, guardo la entrada aquí.
 */
export async function ingresoPorteria(data: IngresoIn, lookup: AccesoLookupResponse): Promise<AccesoRegistroResponse> {
  if (hayRed()) {
    try {
      return await conTope(apiService.accesoIngreso(data), TOPE_REGISTRO_MS);
    } catch (e: unknown) {
      if (esIngresoAbierto(e)) {
        return salidaPorteria({
          numero_documento: data.numero_documento,
          metodo_registro: data.metodo_registro,
          sede_id: data.sede_id,
        }, lookup);
      }
      if (!esFalloDeRed(e)) throw e;
    }
  }
  await encolar({
    tipo: 'INGRESO',
    numero_documento: data.numero_documento,
    sede_id: data.sede_id,
    metodo_registro: data.metodo_registro as AccesoMetodoRegistro,
  });
  return registroLocal(lookup, 'INGRESO');
}

/**
 * Intento el servidor; si no, guardo la salida aquí.
 */
export async function salidaPorteria(data: SalidaIn, lookup: AccesoLookupResponse): Promise<AccesoRegistroResponse> {
  if (hayRed()) {
    try {
      return await conTope(apiService.accesoSalida(data), TOPE_REGISTRO_MS);
    } catch (e: unknown) {
      if (esSinIngresoAbierto(e) && !data.permitir_sin_ingreso) {
        return salidaPorteria({ ...data, permitir_sin_ingreso: true }, lookup);
      }
      if (!esFalloDeRed(e)) throw e;
    }
  }
  await encolar({
    tipo: 'SALIDA',
    numero_documento: data.numero_documento,
    sede_id: data.sede_id,
    metodo_registro: data.metodo_registro as AccesoMetodoRegistro,
    permitir_sin_ingreso: data.permitir_sin_ingreso,
  });
  return registroLocal(lookup, 'SALIDA');
}
