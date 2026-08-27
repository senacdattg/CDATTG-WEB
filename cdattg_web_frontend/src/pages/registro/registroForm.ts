/**
 * @module pages/registro/registroForm
 * @description Tipos y valor vacío del formulario de registro.
 * @author Cristian Deysdayr Jiménez
 */
import type { Dispatch, SetStateAction } from 'react';
import type { RegisterPayload } from '../../services/registerApi';

export type RegistroSetForm = Dispatch<SetStateAction<RegisterPayload>>;

export type RegistroSetCampo = (k: keyof RegisterPayload, v: string | number) => void;

export type RegistroErrores = Partial<Record<keyof RegisterPayload, string>>;

export type RegistroCampoBind = Readonly<{
  errores: RegistroErrores;
  tocar: (k: keyof RegisterPayload) => void;
}>;

export const registroVacio: RegisterPayload = {
  tipo_documento: 0, numero_documento: '', primer_nombre: '', segundo_nombre: '',
  primer_apellido: '', segundo_apellido: '', fecha_nacimiento: '', genero: 0,
  telefono: '', celular: '', email: '', pais_id: 0, departamento_id: 0, municipio_id: 0,
  direccion: '', parametro_id: 0, password: '', password_confirm: '',
};

export const REGISTRO_TITULOS = ['Identidad', 'Nombre', 'Contacto', 'Ubicación', 'Cuenta'] as const;

export const TOTAL_PASOS = REGISTRO_TITULOS.length;
