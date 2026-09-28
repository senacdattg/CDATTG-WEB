/**
 * Armo una ficha de portería si no hay respuesta del servidor.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { AccesoLookupResponse, AccesoModo, AccesoPersonaFicha, AccesoRegistroResponse } from '../../types';

/**
 * Persona que aún no conocemos (cédula digitada sin red).
 */
export function personaNuevaLocal(doc: string): AccesoPersonaFicha {
  return {
    persona_id: 0,
    numero_documento: doc,
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    nombre_completo: doc,
    email: '',
    celular: '',
    telefono: '',
    es_nueva: true,
    perfil_completo: false,
    tipo_sugerido: 'VISITANTE',
    tipos: ['VISITANTE'],
  };
}

/**
 * Lookup de persona nueva o de la copia guardada.
 */
export function lookupLocal(doc: string, sedeId: number, modo: AccesoModo, guardado?: AccesoLookupResponse): AccesoLookupResponse {
  if (guardado && guardado.persona.numero_documento === doc) {
    return { ...guardado, sede_id: sedeId };
  }
  const persona = personaNuevaLocal(doc);
  const salida = modo === 'SALIDA';
  return {
    persona,
    dentro: false,
    accion_sugerida: salida ? 'SALIDA' : 'INGRESO',
    sede_id: sedeId,
    tipos_persona: ['VISITANTE'],
    motivos_salida: [],
    puede_confirmar: true,
    permite_salida_sin_ingreso: salida,
    segundos_restantes_salida: 0,
  };
}

/**
 * Respuesta de registro para que la pantalla no se quede en blanco.
 */
export function registroLocal(lookup: AccesoLookupResponse, accion: 'INGRESO' | 'SALIDA'): AccesoRegistroResponse {
  const pendiente = accion === 'INGRESO'
    ? 'Entrada guardada aquí. Se envía al servidor cuando haya red.'
    : 'Salida guardada aquí. Se envía al servidor cuando haya red.';
  return {
    persona: lookup.persona,
    accion,
    visita_id: 0,
    dentro: accion === 'INGRESO',
    mensaje: pendiente,
    sede_id: lookup.sede_id,
    fichas: lookup.fichas,
    ficha: lookup.ficha,
  };
}
