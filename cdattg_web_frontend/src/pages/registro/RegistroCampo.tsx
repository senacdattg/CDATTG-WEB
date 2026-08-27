/**
 * Este es un campo del registro: etiqueta, si es opcional, ayuda y el error al salir.
 * Lo reutilizo en cada paso para que se vean igual.
 * children es el input o el select; yo solo pongo lo de alrededor.
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
 * Si hay error pinto el borde rojo; si no, el input normal.
 * @param error Mensaje de validación, si lo hay
 * @returns Clase CSS del control
 */
export function claseInput(error?: string): string {
  return error ? 'input-field border-red-400' : 'input-field';
}

/**
 * Etiqueta, el control a ancho completo, texto de ayuda y aviso de error.
 * @param htmlFor Id del input (para que al pulsar la etiqueta enfoque)
 * @param texto Nombre del campo (ej. “Celular”)
 * @param extra Ayuda debajo, si hace falta
 * @param opcional Si es true, escribo “(opcional)” al lado
 * @param error Mensaje en rojo; role="alert" para el lector de pantalla
 * @param children El input o select
 * @returns El bloque del campo
 */
export function RegistroCampo({ htmlFor, texto, extra, opcional, error, children }: Props) {
  // Ids para aria-describedby: ayuda y error no se mezclan.
  const ayudaId = extra ? `${htmlFor}-ayuda` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className="w-full">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {texto}
        {/* Segundo nombre y teléfono no son obligatorios; lo dejo claro aquí. */}
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
