/**
 * @module pages/registro/RegistroSeccion
 * @description Bloque con icono, título y divisor, como el resto de formularios.
 * @author Cristian Deysdayr Jiménez
 */
import type { ReactNode } from 'react';

type Props = Readonly<{
  titulo: string;
  icono: ReactNode;
  children: ReactNode;
}>;

/**
 * Sección visual del registro (datos, contacto, ubicación, etc.).
 */
export function RegistroSeccion({ titulo, icono, children }: Props) {
  return (
    <section className="space-y-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-sena-dark dark:text-gray-100">
        {icono}
        {titulo}
      </h2>
      {children}
    </section>
  );
}
