/**
 * @module pages/portal/PortalSemilleroCard
 * @description Tarjeta pública de un semillero (sigla, color, ficha).
 * @author Cristian Deysdayr Jiménez
 */
import { Link } from 'react-router-dom';
import { portalPaths } from '../../routes/paths';
import { portalMediaUrl } from '../../services/portalApi';
import type { SemilleroItem } from '../../types/portal';

type Props = Readonly<{ item: SemilleroItem }>;

/**
 * Card estilo catálogo (SCBA, SIGEMU, etc.).
 */
export function PortalSemilleroCard({ item }: Props) {
  const color = item.color_identidad || '#39A900';
  return (
    <Link to={portalPaths.semillero(item.slug)} className="card block overflow-hidden hover:shadow-md">
      {item.imagen_url ? (
        <img src={portalMediaUrl(item.imagen_url)} alt="" className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-28 items-center justify-center text-3xl font-extrabold text-white" style={{ background: color }}>
          {item.sigla || item.nombre.slice(0, 4)}
        </div>
      )}
      <div className="p-4">
        {item.sigla ? <p className="text-xs font-semibold uppercase" style={{ color }}>{item.sigla}</p> : null}
        <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">{item.nombre}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{item.resumen || item.descripcion || '—'}</p>
      </div>
    </Link>
  );
}
