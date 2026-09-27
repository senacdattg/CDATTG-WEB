/**
 * Aviso si no hay internet: la portería sigue y luego manda al servidor.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { sincronizarColaPorteria } from './porteriaSincronizar';

/**
 * Escucho si hay red y, al volver, envío la cola.
 */
export function usePorteriaRed(): boolean {
  const [ok, setOk] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const si = () => {
      setOk(true);
      void sincronizarColaPorteria();
    };
    const no = () => setOk(false);
    globalThis.addEventListener('online', si);
    globalThis.addEventListener('offline', no);
    if (navigator.onLine !== false) void sincronizarColaPorteria();
    return () => {
      globalThis.removeEventListener('online', si);
      globalThis.removeEventListener('offline', no);
    };
  }, []);
  return ok;
}

/**
 * Franja corta para el vigilante.
 */
export function PorteriaRedAviso({ hayInternet }: Readonly<{ hayInternet: boolean }>) {
  if (hayInternet) return null;
  return (
    <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
      Sin internet: guardo entradas y salidas aquí y las envío cuando vuelva la red.
    </p>
  );
}
