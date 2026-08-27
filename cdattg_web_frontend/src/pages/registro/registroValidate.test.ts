/**
 * @module pages/registro/registroValidate.test
 * @description Casos feliz, borde y error del registro.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { describe, expect, it } from 'vitest';
import { mensajeRegistroInvalido } from './registroValidate';
import type { RegisterPayload } from '../../services/registerApi';

function base(): RegisterPayload {
  return {
    tipo_documento: 1, numero_documento: '123', primer_nombre: 'ANA', segundo_nombre: '',
    primer_apellido: 'LOPEZ', segundo_apellido: '', fecha_nacimiento: '2000-01-15',
    genero: 1, telefono: '', celular: '3001234567', email: 'ana@sena.edu.co',
    pais_id: 1, departamento_id: 1, municipio_id: 1, direccion: '', parametro_id: 1,
    password: 'Clave1234', password_confirm: 'Clave1234',
  };
}

describe('mensajeRegistroInvalido', () => {
  it('acepta un payload completo', () => {
    expect(mensajeRegistroInvalido(base())).toBe('');
  });

  it('rechaza menor de 14', () => {
    expect(mensajeRegistroInvalido({ ...base(), fecha_nacimiento: '2020-01-01' })).toContain('14');
  });

  it('rechaza contraseñas distintas', () => {
    expect(mensajeRegistroInvalido({ ...base(), password_confirm: 'x' })).toContain('coinciden');
  });

  it('exige catálogos', () => {
    expect(mensajeRegistroInvalido({ ...base(), pais_id: 0 })).toContain('catálogos');
  });
});
