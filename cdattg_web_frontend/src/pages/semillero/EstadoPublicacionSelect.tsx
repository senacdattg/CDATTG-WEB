/**
 * @module pages/semillero/EstadoPublicacionSelect
 * @description Selector borrador / publicado / archivado.
 * @author Cristian Deysdayr Jiménez
 */
import type { PortalEstado } from '../../types/portal';

type Props = Readonly<{ value: PortalEstado; onChange: (v: PortalEstado) => void }>;

/**
 * Estados de publicación del área BIOGIGAS.
 */
export function EstadoPublicacionSelect({ value, onChange }: Props) {
  return (
    <select className="input-field" value={value} onChange={(e) => onChange(e.target.value as PortalEstado)}>
      <option value="borrador">Borrador</option>
      <option value="publicado">Publicado</option>
      <option value="archivado">Archivado</option>
    </select>
  );
}
