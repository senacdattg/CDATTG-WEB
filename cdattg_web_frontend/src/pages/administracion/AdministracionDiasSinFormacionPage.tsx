import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarDaysIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../utils/roles';
import { SelectSearchMulti } from '../../components/SelectSearchMulti';
import type { SelectOption } from '../../components/SelectSearch';
import type {
  DiaSinFormacionFichaItem,
  DiaSinFormacionSedeItem,
  FichaCaracterizacionResponse,
  SedeItem,
} from '../../types';

type FormSedeState = {
  sede_ids: number[];
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
};

type FormFichaState = {
  busqueda: string;
  ficha_ids: number[];
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
};

const emptyFormSede = (): FormSedeState => ({
  sede_ids: [],
  fecha_inicio: '',
  fecha_fin: '',
  motivo: '',
});

const emptyFormFicha = (): FormFichaState => ({
  busqueda: '',
  ficha_ids: [],
  fecha_inicio: '',
  fecha_fin: '',
  motivo: '',
});

function cuerpoTablaSede(
  loading: boolean,
  items: DiaSinFormacionSedeItem[],
  onEliminar: (id: number) => void,
): ReactNode {
  if (loading) {
    return <p className="text-sm text-gray-500">Cargando…</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No hay registros.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-600">
            <th className="px-2 py-2">Sede</th>
            <th className="px-2 py-2">Desde</th>
            <th className="px-2 py-2">Hasta</th>
            <th className="px-2 py-2">Motivo</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
              <td className="px-2 py-2">{item.sede_nombre || item.sede_id}</td>
              <td className="px-2 py-2">{item.fecha_inicio}</td>
              <td className="px-2 py-2">{item.fecha_fin}</td>
              <td className="px-2 py-2">{item.motivo}</td>
              <td className="px-2 py-2 text-right">
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                  onClick={() => onEliminar(item.id)}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cuerpoTablaFicha(
  loading: boolean,
  items: DiaSinFormacionFichaItem[],
  onEliminar: (id: number) => void,
): ReactNode {
  if (loading) {
    return <p className="text-sm text-gray-500">Cargando…</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No hay registros por ficha.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-600">
            <th className="px-2 py-2">Ficha</th>
            <th className="px-2 py-2">Programa</th>
            <th className="px-2 py-2">Desde</th>
            <th className="px-2 py-2">Hasta</th>
            <th className="px-2 py-2">Observación</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
              <td className="px-2 py-2 tabular-nums">{item.ficha_numero || item.ficha_id}</td>
              <td className="px-2 py-2">{item.programa_nombre || '—'}</td>
              <td className="px-2 py-2">{item.fecha_inicio}</td>
              <td className="px-2 py-2">{item.fecha_fin}</td>
              <td className="px-2 py-2">{item.motivo}</td>
              <td className="px-2 py-2 text-right">
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                  onClick={() => onEliminar(item.id)}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function etiquetaFichaOpcion(f: FichaCaracterizacionResponse): string {
  const prog = f.programa_formacion_nombre?.trim();
  return prog ? `${f.ficha} — ${prog}` : f.ficha;
}

export function AdministracionDiasSinFormacionPage() {
  const { roles } = useAuth();
  const canManage = hasAnyRole(roles, ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR']);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [itemsSede, setItemsSede] = useState<DiaSinFormacionSedeItem[]>([]);
  const [itemsFicha, setItemsFicha] = useState<DiaSinFormacionFichaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSede, setSavingSede] = useState(false);
  const [savingFicha, setSavingFicha] = useState(false);
  const [buscandoFichas, setBuscandoFichas] = useState(false);
  const [formSede, setFormSede] = useState<FormSedeState>(emptyFormSede);
  const [formFicha, setFormFicha] = useState<FormFichaState>(emptyFormFicha);
  const [fichasEncontradas, setFichasEncontradas] = useState<FichaCaracterizacionResponse[]>([]);
  const [filterSedeIds, setFilterSedeIds] = useState<number[]>([]);
  const [vista, setVista] = useState<'sede' | 'ficha'>('sede');

  const sedeOptions = useMemo<SelectOption[]>(
    () => sedes.map((s) => ({ value: s.id, label: s.nombre })),
    [sedes],
  );

  const fichaOptions = useMemo<SelectOption[]>(
    () =>
      fichasEncontradas.map((f) => ({
        value: f.id,
        label: etiquetaFichaOpcion(f),
      })),
    [fichasEncontradas],
  );

  const itemsSedeFiltrados = useMemo(() => {
    if (filterSedeIds.length === 0) return itemsSede;
    const filtro = new Set(filterSedeIds);
    return itemsSede.filter((item) => filtro.has(item.sede_id));
  }, [filterSedeIds, itemsSede]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sedesData, listSede, listFicha] = await Promise.all([
        apiService.getCatalogosSedes(),
        apiService.getDiasSinFormacion(),
        apiService.getDiasSinFormacionFicha(),
      ]);
      setSedes(sedesData);
      setItemsSede(listSede);
      setItemsFicha(listFicha);
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo cargar días sin formación'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    void load();
  }, [canManage, load]);

  const buscarFichas = async () => {
    const q = formFicha.busqueda.trim();
    if (!q) {
      globalThis.alert('Escriba código de ficha o nombre del programa.');
      return;
    }
    setBuscandoFichas(true);
    try {
      const res = await apiService.getFichasCaracterizacion(1, 50, undefined, undefined, q);
      setFichasEncontradas(res.data ?? []);
      setFormFicha((p) => ({ ...p, ficha_ids: [] }));
      if ((res.data ?? []).length === 0) {
        globalThis.alert('No se encontraron fichas para esa búsqueda.');
      }
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo buscar fichas'));
    } finally {
      setBuscandoFichas(false);
    }
  };

  const guardarSede = async () => {
    if (
      formSede.sede_ids.length === 0 ||
      !formSede.fecha_inicio ||
      !formSede.fecha_fin ||
      !formSede.motivo.trim()
    ) {
      globalThis.alert('Complete al menos una sede, rango de fechas y motivo.');
      return;
    }
    setSavingSede(true);
    try {
      const payload = {
        fecha_inicio: formSede.fecha_inicio,
        fecha_fin: formSede.fecha_fin,
        motivo: formSede.motivo.trim(),
      };
      await Promise.all(
        formSede.sede_ids.map((sede_id) => apiService.createDiaSinFormacion({ ...payload, sede_id })),
      );
      setFormSede(emptyFormSede());
      await load();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo registrar el día sin formación'));
    } finally {
      setSavingSede(false);
    }
  };

  const guardarFicha = async () => {
    if (
      formFicha.ficha_ids.length === 0 ||
      !formFicha.fecha_inicio ||
      !formFicha.fecha_fin ||
      !formFicha.motivo.trim()
    ) {
      globalThis.alert('Seleccione al menos una ficha, rango de fechas y observación.');
      return;
    }
    setSavingFicha(true);
    try {
      await apiService.createDiaSinFormacionFicha({
        ficha_ids: formFicha.ficha_ids,
        fecha_inicio: formFicha.fecha_inicio,
        fecha_fin: formFicha.fecha_fin,
        motivo: formFicha.motivo.trim(),
      });
      setFormFicha(emptyFormFicha());
      setFichasEncontradas([]);
      await load();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo registrar la novedad por ficha'));
    } finally {
      setSavingFicha(false);
    }
  };

  const eliminarSede = async (id: number) => {
    if (!globalThis.confirm('¿Eliminar este registro de día sin formación por sede?')) return;
    try {
      await apiService.deleteDiaSinFormacion(id);
      await load();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo eliminar'));
    }
  };

  const eliminarFicha = async (id: number) => {
    if (!globalThis.confirm('¿Eliminar este registro de día sin formación por ficha?')) return;
    try {
      await apiService.deleteDiaSinFormacionFicha(id);
      await load();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo eliminar'));
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">No tiene permisos para administrar esta sección.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <CalendarDaysIcon className="h-7 w-7 text-emerald-600" aria-hidden />
          Días sin formación
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Elija el tipo de registro. Esos días no permiten tomar asistencia ni generan inasistencia; en el panel
          analítico (bloque B) las novedades por ficha se muestran en rojo.
        </p>
      </div>

      <div
        className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-800/80"
        role="tablist"
        aria-label="Tipo de día sin formación"
      >
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'sede'}
          onClick={() => setVista('sede')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'sede'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Por sede
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={vista === 'ficha'}
          onClick={() => setVista('ficha')}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            vista === 'ficha'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Por ficha / programa
        </button>
      </div>

      {vista === 'sede' ? (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Por sede</h2>
        <div className="card space-y-4 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Nuevo registro por sede</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="dsf-sede" className="mb-1 block text-xs text-gray-500">
                Sedes
              </label>
              <SelectSearchMulti
                inputId="dsf-sede"
                options={sedeOptions}
                value={formSede.sede_ids}
                onChange={(sede_ids) => setFormSede({ ...formSede, sede_ids })}
                placeholder="Seleccione una o más sedes"
                isDisabled={savingSede || loading}
                ariaLabel="Sedes del día sin formación"
              />
            </div>
            <div>
              <label htmlFor="dsf-motivo" className="mb-1 block text-xs text-gray-500">
                Motivo (ej. PARO)
              </label>
              <input
                id="dsf-motivo"
                className="input-field w-full"
                value={formSede.motivo}
                onChange={(e) => setFormSede({ ...formSede, motivo: e.target.value })}
                maxLength={255}
              />
            </div>
            <div>
              <label htmlFor="dsf-inicio" className="mb-1 block text-xs text-gray-500">
                Fecha inicio
              </label>
              <input
                id="dsf-inicio"
                type="date"
                className="input-field w-full"
                value={formSede.fecha_inicio}
                onChange={(e) => setFormSede({ ...formSede, fecha_inicio: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="dsf-fin" className="mb-1 block text-xs text-gray-500">
                Fecha fin
              </label>
              <input
                id="dsf-fin"
                type="date"
                className="input-field w-full"
                value={formSede.fecha_fin}
                onChange={(e) => setFormSede({ ...formSede, fecha_fin: e.target.value })}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => void guardarSede()}
            disabled={savingSede}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            {savingSede ? 'Guardando…' : 'Registrar'}
          </button>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Registros por sede</h3>
            <div className="min-w-[16rem] flex-1 max-w-md">
              <label htmlFor="dsf-filtro-sede" className="mb-1 block text-xs text-gray-500">
                Filtrar por sede
              </label>
              <SelectSearchMulti
                inputId="dsf-filtro-sede"
                options={sedeOptions}
                value={filterSedeIds}
                onChange={setFilterSedeIds}
                placeholder="Todas las sedes"
                isDisabled={loading}
                ariaLabel="Filtrar registros por sede"
              />
            </div>
          </div>
          {cuerpoTablaSede(loading, itemsSedeFiltrados, (id) => void eliminarSede(id))}
        </div>
      </section>
      ) : (
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Por ficha o programa (novedad)</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Busque por código de ficha o nombre del programa, revise las fichas relacionadas y seleccione una o
            varias. Indique la observación del porqué no hubo formación.
          </p>
        </div>

        <div className="card space-y-4 p-4">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Nuevo registro por ficha</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="dsf-ficha-q" className="mb-1 block text-xs text-gray-500">
                Buscar ficha o programa
              </label>
              <input
                id="dsf-ficha-q"
                className="input-field w-full"
                value={formFicha.busqueda}
                onChange={(e) => setFormFicha({ ...formFicha, busqueda: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void buscarFichas();
                  }
                }}
                placeholder="Ej. 3173334 o Análisis y desarrollo de software"
              />
            </div>
            <button
              type="button"
              className="btn-secondary inline-flex h-10 items-center gap-2"
              onClick={() => void buscarFichas()}
              disabled={buscandoFichas || savingFicha}
            >
              <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
              {buscandoFichas ? 'Buscando…' : 'Buscar fichas'}
            </button>
          </div>

          <div>
            <label htmlFor="dsf-ficha-sel" className="mb-1 block text-xs text-gray-500">
              Fichas encontradas (seleccione una o varias)
            </label>
            <SelectSearchMulti
              inputId="dsf-ficha-sel"
              options={fichaOptions}
              value={formFicha.ficha_ids}
              onChange={(ficha_ids) => setFormFicha({ ...formFicha, ficha_ids })}
              placeholder={
                fichasEncontradas.length === 0
                  ? 'Busque primero por ficha o programa'
                  : 'Seleccione fichas'
              }
              isDisabled={savingFicha || fichasEncontradas.length === 0}
              ariaLabel="Fichas del día sin formación"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="dsf-ficha-obs" className="mb-1 block text-xs text-gray-500">
                Observación (por qué no hubo formación)
              </label>
              <textarea
                id="dsf-ficha-obs"
                className="input-field w-full min-h-[80px]"
                value={formFicha.motivo}
                onChange={(e) => setFormFicha({ ...formFicha, motivo: e.target.value })}
                maxLength={500}
                placeholder="Ej. Instructor en comisión / salida pedagógica cancelada"
              />
            </div>
            <div>
              <label htmlFor="dsf-ficha-inicio" className="mb-1 block text-xs text-gray-500">
                Fecha inicio
              </label>
              <input
                id="dsf-ficha-inicio"
                type="date"
                className="input-field w-full"
                value={formFicha.fecha_inicio}
                onChange={(e) => setFormFicha({ ...formFicha, fecha_inicio: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="dsf-ficha-fin" className="mb-1 block text-xs text-gray-500">
                Fecha fin
              </label>
              <input
                id="dsf-ficha-fin"
                type="date"
                className="input-field w-full"
                value={formFicha.fecha_fin}
                onChange={(e) => setFormFicha({ ...formFicha, fecha_fin: e.target.value })}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-2"
            onClick={() => void guardarFicha()}
            disabled={savingFicha}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            {savingFicha ? 'Guardando…' : 'Registrar novedad'}
          </button>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">Registros por ficha</h3>
          {cuerpoTablaFicha(loading, itemsFicha, (id) => void eliminarFicha(id))}
        </div>
      </section>
      )}
    </div>
  );
}
