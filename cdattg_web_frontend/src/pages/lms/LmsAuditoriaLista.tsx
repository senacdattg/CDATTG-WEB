/**
 * @module pages/lms/LmsAuditoriaLista
 * @description Listado de carpetas raíz encontradas.
 * @author Cristian Deysdayr Jiménez
 */
import { lmsPaths } from '../../routes/paths';
import { LmsAuditoriaCarpeta } from './LmsAuditoriaCarpeta';
import type { LmsAuditoriaPersonaItem } from '../../types/lmsAuditoria';

type Props = Readonly<{ personas: LmsAuditoriaPersonaItem[] }>;

/**
 * Cada persona es una carpeta con cédula y nombre.
 */
export function LmsAuditoriaLista({ personas }: Props) {
  if (personas.length === 0) {
    return <p className="text-sm text-gray-500">No hay carpetas para esta búsqueda.</p>;
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {personas.map((p) => (
        <li key={p.persona_id}>
          <LmsAuditoriaCarpeta
            titulo={p.nombre_carpeta || `${p.documento} ${p.nombre}`}
            detalle={p.nombre}
            to={lmsPaths.auditoriaPersona(p.persona_id)}
          />
        </li>
      ))}
    </ul>
  );
}
