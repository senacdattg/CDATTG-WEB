/**
 * @module pages/lms/useLmsObjectUrl
 * @description URL temporal de un PDF para iframe o pestaña.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';

/**
 * Crea y limpia el object URL del blob o archivo local.
 * @param {Blob | null} blob PDF en memoria.
 */
export function useLmsObjectUrl(blob: Blob | null): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const href = URL.createObjectURL(blob);
    setUrl(href);
    return () => URL.revokeObjectURL(href);
  }, [blob]);
  return url;
}
