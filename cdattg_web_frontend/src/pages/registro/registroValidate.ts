/**
 * @module pages/registro/registroValidate
 * @description Validación por campo, por paso y del formulario completo.
 * @author Cristian Deysdayr Jiménez
 */
import type { RegisterPayload } from '../../services/registerApi';

export const CAMPOS_POR_PASO: readonly (readonly (keyof RegisterPayload)[])[] = [
  ['tipo_documento', 'numero_documento', 'fecha_nacimiento', 'genero'],
  ['primer_nombre', 'primer_apellido'],
  ['celular', 'telefono', 'email'],
  ['pais_id', 'departamento_id', 'municipio_id'],
  ['parametro_id', 'password', 'password_confirm'],
];

/**
 * Error de un campo al salir de él, o vacío si es válido.
 */
export function mensajeCampoRegistro(p: RegisterPayload, k: keyof RegisterPayload): string {
  switch (k) {
    case 'tipo_documento': return p.tipo_documento ? '' : 'Seleccione el tipo de documento';
    case 'numero_documento': return textoSinSeparadores(p.numero_documento, 'el número de documento');
    case 'fecha_nacimiento': return mensajeEdad(p.fecha_nacimiento);
    case 'genero': return p.genero ? '' : 'Seleccione el género';
    case 'primer_nombre': return p.primer_nombre.trim() ? '' : 'Indique el primer nombre';
    case 'primer_apellido': return p.primer_apellido.trim() ? '' : 'Indique el primer apellido';
    case 'celular': return textoSinSeparadores(p.celular, 'el celular');
    case 'telefono': return p.telefono.trim() ? textoSinSeparadores(p.telefono, 'el teléfono') : '';
    case 'email': return mensajeEmail(p.email);
    case 'pais_id': return p.pais_id ? '' : 'Seleccione el país';
    case 'departamento_id': return p.departamento_id ? '' : 'Seleccione el departamento';
    case 'municipio_id': return p.municipio_id ? '' : 'Seleccione el municipio';
    case 'parametro_id': return p.parametro_id ? '' : 'Marque al menos una caracterización';
    case 'password': return mensajeClave(p.password);
    case 'password_confirm': return p.password === p.password_confirm ? '' : 'Las contraseñas no coinciden';
    default: return '';
  }
}

/**
 * Primer error del paso indicado.
 */
export function mensajePasoInvalido(paso: number, p: RegisterPayload): string {
  const campos = CAMPOS_POR_PASO[paso];
  if (!campos) return '';
  return campos.map((k) => mensajeCampoRegistro(p, k)).find((m) => m) ?? '';
}

/**
 * Mensaje de error o vacío si el payload es válido.
 */
export function mensajeRegistroInvalido(p: RegisterPayload): string {
  return CAMPOS_POR_PASO.map((_, i) => mensajePasoInvalido(i, p)).find((m) => m) ?? '';
}

function textoSinSeparadores(v: string, etiqueta: string): string {
  const t = v.trim();
  if (!t) return `Indique ${etiqueta}`;
  if (/[\s.\-]/.test(t)) return 'Escríbalo sin puntos, guiones ni espacios';
  return '';
}

function mensajeEmail(v: string): string {
  const t = v.trim();
  if (!t) return 'Indique el correo electrónico';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? '' : 'Revise el formato del correo';
}

function mensajeClave(v: string): string {
  if (v.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(v) || !/\d/.test(v)) {
    return 'La contraseña debe incluir letras y números';
  }
  return '';
}

function mensajeEdad(fecha: string): string {
  if (!fecha) return 'Indique la fecha de nacimiento';
  const nac = new Date(`${fecha}T00:00:00`);
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 14);
  if (Number.isNaN(nac.getTime()) || nac > limite) {
    return 'Debe tener al menos 14 años para registrarse';
  }
  return '';
}
