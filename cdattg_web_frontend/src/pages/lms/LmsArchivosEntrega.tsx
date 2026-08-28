/**
 * @module pages/lms/LmsArchivosEntrega
 * @description PDFs de una entrega con vista previa en el aula.
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback } from 'react';
import { blobLmsEntregaArchivo } from '../../services/lmsApi';
import { LmsPdfRemoto } from './LmsPdfRemoto';
import type { LmsArchivoItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividadId: number;
  entregaId: number;
  archivos: LmsArchivoItem[] | undefined;
  vacio: string;
}>;

/**
 * Lista cada PDF ya guardado. Si no hay, muestro el texto vacío.
 */
export function LmsArchivosEntrega({ fichaId, actividadId, entregaId, archivos, vacio }: Props) {
  if (!archivos?.length) {
    return <p className="text-sm italic text-gray-500">{vacio}</p>;
  }
  return (
    <ul className="space-y-3">
      {archivos.map((a) => (
        <li key={a.id}>
          <LmsPdfEntregaItem fichaId={fichaId} actividadId={actividadId} entregaId={entregaId} archivo={a} />
        </li>
      ))}
    </ul>
  );
}

type ItemProps = Readonly<{
  fichaId: number;
  actividadId: number;
  entregaId: number;
  archivo: LmsArchivoItem;
}>;

/**
 * Un PDF remoto: cargo con token y lo muestro.
 */
function LmsPdfEntregaItem({ fichaId, actividadId, entregaId, archivo }: ItemProps) {
  const cargar = useCallback(
    () => blobLmsEntregaArchivo(fichaId, actividadId, entregaId, archivo.id),
    [fichaId, actividadId, entregaId, archivo.id],
  );
  return <LmsPdfRemoto titulo={archivo.nombre} cargar={cargar} />;
}
