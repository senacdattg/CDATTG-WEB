/**
 * @module pages/lms/useLmsAuditoria
 * @description Lista carpetas raíz (20 por página) y tarjetas si el filtro es ficha.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { buscarLmsAuditoria } from '../../services/lmsAuditoriaApi';
import type { LmsAuditoriaPersonaItem } from '../../types/lmsAuditoria';
import type { LmsAulaListItem } from '../../types/lms';

/**
 * Consulta el API al cambiar el filtro o la página.
 */
export function useLmsAuditoria(q: string, page: number) {
  const [fichas, setFichas] = useState<LmsAulaListItem[]>([]);
  const [personas, setPersonas] = useState<LmsAuditoriaPersonaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    setLoading(true);
    const t = globalThis.setTimeout(() => {
      buscarLmsAuditoria(q, page)
        .then((data) => {
          if (!vivo) return;
          setFichas(data.fichas);
          setPersonas(data.personas);
          setTotal(data.total);
          setError('');
        })
        .catch(() => {
          if (vivo) setError('No se pudo buscar.');
        })
        .finally(() => {
          if (vivo) setLoading(false);
        });
    }, 300);
    return () => {
      vivo = false;
      globalThis.clearTimeout(t);
    };
  }, [q, page]);

  return { fichas, personas, total, loading, error };
}
