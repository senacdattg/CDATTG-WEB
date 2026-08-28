/**
 * @module pages/lms/LmsPdfRemoto
 * @description Carga el PDF del aula y lo muestra sin forzar la descarga.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { LmsPdfVista } from './LmsPdfVista';
import { useLmsObjectUrl } from './useLmsObjectUrl';

type Props = Readonly<{ titulo: string; cargar: () => Promise<Blob> }>;

/**
 * Pide el archivo con el token y arma la vista previa.
 */
export function LmsPdfRemoto({ titulo, cargar }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let vivo = true;
    void cargar()
      .then((b) => {
        if (vivo) setBlob(new Blob([b], { type: 'application/pdf' }));
      })
      .catch(() => {
        if (vivo) setError('No se pudo mostrar el PDF');
      });
    return () => {
      vivo = false;
    };
  }, [cargar]);
  const url = useLmsObjectUrl(blob);
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!url) return <p className="text-sm text-gray-500">Cargando vista previa de {titulo}…</p>;
  return <LmsPdfVista titulo={titulo} blobUrl={url} />;
}
