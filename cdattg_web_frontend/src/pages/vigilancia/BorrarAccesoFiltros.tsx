/**
 * Filtro de sede y fechas para borrar visitas de portería.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { RegionalItem, SedeItem } from '../../types';
import { atajoFechaAcceso, haceDiasISO, hoyISO, type AtajoFechaAcceso } from './borrarAccesoFrase';

type Props = Readonly<{
  regionales: RegionalItem[];
  sedes: SedeItem[];
  regionalId: string;
  sedeId: string;
  fechaDesde: string;
  fechaHasta: string;
  onRegional: (v: string) => void;
  onSede: (v: string) => void;
  onDesde: (v: string) => void;
  onHasta: (v: string) => void;
}>;

function chipAtajo(activo: boolean): string {
  return activo
    ? 'rounded-full bg-green-700 px-3 py-1 text-sm font-semibold text-white'
    : 'rounded-full border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800';
}

/**
 * Pinto sede y atajos; el botón elegido se ve lleno.
 */
export function BorrarAccesoFiltros({
  regionales, sedes, regionalId, sedeId, fechaDesde, fechaHasta,
  onRegional, onSede, onDesde, onHasta,
}: Props) {
  const atajo: AtajoFechaAcceso = atajoFechaAcceso(fechaDesde, fechaHasta);
  const sedesFiltradas = sedes.filter((s) => !regionalId || String(s.regional_id ?? '') === regionalId);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="bor-reg" className="mb-1 block text-sm font-medium">Regional</label>
        <select id="bor-reg" className="input-field w-full" value={regionalId} onChange={(e) => { onRegional(e.target.value); onSede(''); }}>
          <option value="">Todas</option>
          {regionales.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="bor-sede" className="mb-1 block text-sm font-medium">Sede</label>
        <select id="bor-sede" className="input-field w-full" value={sedeId} onChange={(e) => onSede(e.target.value)}>
          <option value="">Todas</option>
          {sedesFiltradas.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="bor-desde" className="mb-1 block text-sm font-medium">Desde</label>
        <input id="bor-desde" type="date" className="input-field w-full" value={fechaDesde} onChange={(e) => onDesde(e.target.value)} />
      </div>
      <div>
        <label htmlFor="bor-hasta" className="mb-1 block text-sm font-medium">Hasta</label>
        <input id="bor-hasta" type="date" className="input-field w-full" value={fechaHasta} onChange={(e) => onHasta(e.target.value)} />
      </div>
      <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0 sm:col-span-2 lg:col-span-4">
        <legend className="sr-only">Atajos de fecha</legend>
        <button type="button" aria-pressed={atajo === 'hoy'} className={chipAtajo(atajo === 'hoy')} onClick={() => { const h = hoyISO(); onDesde(h); onHasta(h); }}>Solo hoy</button>
        <button type="button" aria-pressed={atajo === '7d'} className={chipAtajo(atajo === '7d')} onClick={() => { onDesde(haceDiasISO(7)); onHasta(hoyISO()); }}>Últimos 7 días</button>
        <button type="button" aria-pressed={atajo === 'historico'} className={chipAtajo(atajo === 'historico')} onClick={() => { onDesde(''); onHasta(hoyISO()); }}>Histórico hasta hoy</button>
      </fieldset>
    </div>
  );
}
