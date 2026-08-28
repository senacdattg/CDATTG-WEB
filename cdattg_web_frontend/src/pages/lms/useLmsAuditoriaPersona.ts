/**
 * @module pages/lms/useLmsAuditoriaPersona
 * @description Carga la raíz y las tres carpetas de tipo.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { fetchLmsAuditoriaPersona } from '../../services/lmsAuditoriaApi';
import type { LmsAuditoriaPersonaDetalle } from '../../types/lmsAuditoria';

/**
 * Trae el detalle de una persona al abrir Ver más.
 */
export function useLmsAuditoriaPersona(personaId: number) {
  const [det, setDet] = useState<LmsAuditoriaPersonaDetalle | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let vivo = true;
    fetchLmsAuditoriaPersona(personaId)
      .then((row) => {
        if (vivo) setDet(row);
      })
      .catch(() => {
        if (vivo) setError('No se pudo abrir la carpeta.');
      });
    return () => {
      vivo = false;
    };
  }, [personaId]);
  return { det, error };
}
