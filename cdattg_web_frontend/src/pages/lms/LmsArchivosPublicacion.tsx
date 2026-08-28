/**
 * @module pages/lms/LmsArchivosPublicacion
 * @description PDFs ya guardados de la actividad, con vista previa.
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback } from 'react';
import { blobLmsActividadArchivo } from '../../services/lmsApi';
import { esPdfNombre } from './lmsArchivoPdf';
import { LmsPdfRemoto } from './LmsPdfRemoto';
import type { LmsArchivoItem } from '../../types/lms';

type Props = Readonly<{
  fichaId: number;
  actividadId: number;
  archivos: LmsArchivoItem[] | undefined;
}>;

/**
 * Si es PDF lo muestro; si no, solo el nombre.
 */
export function LmsArchivosPublicacion({ fichaId, actividadId, archivos }: Props) {
  if (!archivos?.length) {
    return <p className="text-sm italic text-gray-500">Sin archivos adjuntos.</p>;
  }
  return (
    <ul className="space-y-3">
      {archivos.map((a) => (
        <li key={a.id}>
          {esPdfNombre(a.nombre) ? (
            <LmsPdfPublicacionItem fichaId={fichaId} actividadId={actividadId} archivo={a} />
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">{a.nombre}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

type ItemProps = Readonly<{ fichaId: number; actividadId: number; archivo: LmsArchivoItem }>;

/** Un PDF de la publicación. */
function LmsPdfPublicacionItem({ fichaId, actividadId, archivo }: ItemProps) {
  const cargar = useCallback(
    () => blobLmsActividadArchivo(fichaId, actividadId, archivo.id),
    [fichaId, actividadId, archivo.id],
  );
  return <LmsPdfRemoto titulo={archivo.nombre} cargar={cargar} />;
}
