/**
 * @module pages/lms/LmsPublicarVistaPrevia
 * @description Vista previa de los PDF que el instructor acaba de elegir.
 * @author Cristian Deysdayr Jiménez
 */
import { esPdfNombre } from './lmsArchivoPdf';
import { LmsPdfLocal } from './LmsPdfLocal';

type Props = Readonly<{ files: File[] }>;

/**
 * Misma vista que en la entrega del aprendiz, antes de publicar o guardar.
 */
export function LmsPublicarVistaPrevia({ files }: Props) {
  const pdfs = files.filter((f) => esPdfNombre(f.name));
  if (pdfs.length === 0) return null;
  return (
    <ul className="space-y-3">
      {pdfs.map((f) => (
        <li key={`${f.name}-${f.size}-${f.lastModified}`}>
          <LmsPdfLocal file={f} />
        </li>
      ))}
    </ul>
  );
}
