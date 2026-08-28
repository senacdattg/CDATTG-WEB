/**
 * @module pages/lms/LmsSoloConsultaAviso
 * @description Aviso cuando el aprendiz entra al aula pero no puede entregar.
 * Lo hice para no repetir la franja ámbar en el aula y en Mi trabajo.
 * @author Cristian Deysdayr Jiménez
 */
type Props = Readonly<{ children: string }>;

/**
 * Franja de solo consulta. El texto lo pone quien lo usa.
 * @param {string} children Mensaje visible.
 */
export function LmsSoloConsultaAviso({ children }: Props) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
      {children}
    </p>
  );
}
