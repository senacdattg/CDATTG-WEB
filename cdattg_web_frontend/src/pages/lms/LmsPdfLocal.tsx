/**
 * @module pages/lms/LmsPdfLocal
 * @description Vista previa del PDF que acaban de elegir, aún sin enviar.
 * @author Cristian Deysdayr Jiménez
 */
import { LmsPdfVista } from './LmsPdfVista';
import { useLmsObjectUrl } from './useLmsObjectUrl';

type Props = Readonly<{ file: File }>;

/**
 * Usa el archivo del disco, aún no enviado.
 */
export function LmsPdfLocal({ file }: Props) {
  const url = useLmsObjectUrl(file);
  if (!url) return null;
  return <LmsPdfVista titulo={file.name} blobUrl={url} />;
}
