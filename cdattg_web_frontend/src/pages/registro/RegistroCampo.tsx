/**
 * @module pages/registro/RegistroCampo
 * @description Campo de una columna: opcional explícito, ayuda y error al salir.
 * @author Cristian Deysdayr Jiménez
 */
import type { ReactNode } from 'react';

type Props = Readonly<{
  htmlFor: string;
  texto: string;
  extra?: string;
  opcional?: boolean;
  error?: string;
  children: ReactNode;
}>;

/**
 * Clase del input según haya error de validación.
 */
export function claseInput(error?: string): string {
  return error ? 'input-field border-red-400' : 'input-field';
}

/**
 * Etiqueta, control a ancho completo, texto de ayuda y aviso de error.
 */
export function RegistroCampo({ htmlFor, texto, extra, opcional, error, children }: Props) {
  const ayudaId = extra ? `${htmlFor}-ayuda` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className="w-full">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {texto}
        {opcional ? <span className="font-normal text-gray-500"> (opcional)</span> : null}
      </label>
      {children}
      {extra ? (
        <p id={ayudaId} className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{extra}</p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
