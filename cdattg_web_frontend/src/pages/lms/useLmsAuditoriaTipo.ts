/**
 * @module pages/lms/useLmsAuditoriaTipo
 * @description Carga fichas y entregas de un tipo de formación.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { fetchLmsAuditoriaTipo } from '../../services/lmsAuditoriaApi';
import type { LmsAuditoriaTipoDetalle } from '../../types/lmsAuditoria';

/**
 * Trae el contenido de Regular, Media Técnica o Complementaria.
 */
export function useLmsAuditoriaTipo(personaId: number, tipo: string) {
  const [det, setDet] = useState<LmsAuditoriaTipoDetalle | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!tipo) return;
    let vivo = true;
    fetchLmsAuditoriaTipo(personaId, tipo)
      .then((row) => {
        if (vivo) setDet(row);
      })
      .catch(() => {
        if (vivo) setError('No se pudo abrir esta carpeta.');
      });
    return () => {
      vivo = false;
    };
  }, [personaId, tipo]);
  return { det, error };
}
