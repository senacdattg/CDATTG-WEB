/**
 * @module pages/lms/useLmsAuditoriaFicha
 * @description Carga las carpetas raíz de las personas de una ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { fetchLmsAuditoriaFicha } from '../../services/lmsAuditoriaApi';
import type { LmsAuditoriaPersonaItem } from '../../types/lmsAuditoria';

/**
 * Trae las carpetas al auditar una ficha.
 */
export function useLmsAuditoriaFicha(fichaId: number) {
  const [personas, setPersonas] = useState<LmsAuditoriaPersonaItem[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!fichaId) return undefined;
    let vivo = true;
    fetchLmsAuditoriaFicha(fichaId)
      .then((list) => {
        if (vivo) setPersonas(list);
      })
      .catch(() => {
        if (vivo) setError('No se pudo abrir la ficha.');
      });
    return () => {
      vivo = false;
    };
  }, [fichaId]);
  return { personas, error };
}
