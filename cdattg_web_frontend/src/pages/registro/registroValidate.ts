/**
 * @module pages/registro/registroValidate
 * @description Validación local del formulario de registro.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import type { RegisterPayload } from '../../services/registerApi';

/**
 * Mensaje de error o vacío si el payload es válido.
 */
export function mensajeRegistroInvalido(p: RegisterPayload): string {
  if (!p.tipo_documento || !p.genero || !p.pais_id || !p.departamento_id || !p.municipio_id || !p.parametro_id) {
    return 'Complete los catálogos obligatorios';
  }
  if (p.password !== p.password_confirm) {
    return 'Las contraseñas no coinciden';
  }
  if (p.password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  const letra = /[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(p.password);
  const numero = /\d/.test(p.password);
  if (!letra || !numero) {
    return 'La contraseña debe incluir letras y números';
  }
  const nac = new Date(`${p.fecha_nacimiento}T00:00:00`);
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 14);
  if (Number.isNaN(nac.getTime()) || nac > limite) {
    return 'Debe tener al menos 14 años para registrarse';
  }
  return '';
}
