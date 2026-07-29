import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { FichaCaracterizacionCard } from '../../components/FichaCaracterizacionCard';
import type {
  AnalisisAprendicesFichaResponse,
  AnalisisExplorarFichasResponse,
  AnalisisRegistrosAprendizResponse,
  FichaCaracterizacionResponse,
} from '../../types';

type Props = Readonly<{
  fechaDesde: string;
  fechaHasta: string;
  regionalId?: number;
  sedeId?: number;
}>;

type FichaExplorar = AnalisisExplorarFichasResponse['fichas'][number];
type AprendizResumen = AnalisisAprendicesFichaResponse['aprendices'][number];
type Registro = AnalisisRegistrosAprendizResponse['aprendices'][number]['registros'][number];

const PLACEHOLDER_BUSCAR = 'Buscar por código de ficha o programa';
const PLACEHOLDER_FILTRO_APRENDIZ = 'Buscar por nombre o documento';

function toFichaCard(f: FichaExplorar): FichaCaracterizacionResponse {
  return {
    id: f.ficha_id,
    programa_formacion_id: 0,
    ficha: f.ficha_numero,
    programa_formacion_nombre: f.programa_nombre,
    sede_nombre: f.sede_nombre,
    jornada_nombre: f.jornada_nombre,
    instructor_nombre: f.instructor_nombre,
    ambiente_nombre: f.ambiente_nombre,
    modalidad_formacion_nombre: f.modalidad_nombre,
    cantidad_aprendices: f.cantidad_aprendices,
    status: f.status,
  };
}

function formatFechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function HistorialIngresoSalida({
  aprendiz,
  fichaNumero,
  registros,
  loading,
  error,
  onVolver,
}: Readonly<{
  aprendiz: AprendizResumen;
  fichaNumero: string;
  registros: Registro[];
  loading: boolean;
  error: string;
  onVolver: () => void;
}>) {
  const fechasConRegistro = useMemo(() => {
    const set = new Set(registros.map((r) => r.fecha));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [registros]);

  const [diaSel, setDiaSel] = useState('');

  useEffect(() => {
    setDiaSel(fechasConRegistro[0] ?? '');
  }, [fechasConRegistro]);

  const delDia = useMemo(
    () => (diaSel ? registros.filter((r) => r.fecha === diaSel) : []),
    [registros, diaSel],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          <ArrowLeftIcon className="w-4 h-4" aria-hidden />
          Volver a aprendices
        </button>
        <div className="text-right text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-900 dark:text-white">{aprendiz.nombre_completo}</p>
          <p>
            Doc. {aprendiz.numero_documento || '—'} · Ficha {fichaNumero}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {!loading && fechasConRegistro.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-10 text-center text-sm text-gray-500">
          Sin registros de ingreso/salida en el período del panel.
        </div>
      ) : null}

      {fechasConRegistro.length > 0 ? (
        <>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
              <CalendarDaysIcon className="h-5 w-5 text-primary-600" aria-hidden />
              Seleccione el día
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="min-w-[200px]">
                <label htmlFor="historial-dia" className="mb-1 block text-xs font-medium text-gray-500">
                  Fecha
                </label>
                <input
                  id="historial-dia"
                  type="date"
                  value={diaSel}
                  min={fechasConRegistro.at(-1)}
                  max={fechasConRegistro[0]}
                  onChange={(e) => setDiaSel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 pb-2 capitalize">
                {diaSel ? formatFechaLarga(diaSel) : '—'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {fechasConRegistro.slice(0, 14).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDiaSel(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    diaSel === f
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
              {fechasConRegistro.length > 14 ? (
                <span className="self-center text-xs text-gray-500">
                  +{fechasConRegistro.length - 14} días más (use el calendario)
                </span>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">
              Tomas del {diaSel ? formatFechaLarga(diaSel) : 'día'}
            </h3>
            {delDia.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {delDia.map((r, idx) => (
                  <div
                    key={`${r.asistencia_id}-${r.hora_ingreso ?? ''}-${idx}`}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/50"
                  >
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Toma {idx + 1}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-green-50 px-3 py-3 dark:bg-green-900/20">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-300">
                          <ClockIcon className="h-4 w-4" aria-hidden />
                          Ingreso
                        </div>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-green-800 dark:text-green-200">
                          {r.hora_ingreso ?? '—'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-sky-50 px-3 py-3 dark:bg-sky-900/20">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                          <ClockIcon className="h-4 w-4" aria-hidden />
                          Salida
                        </div>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-sky-800 dark:text-sky-200">
                          {r.hora_salida ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-4 py-8 text-center text-sm text-gray-500">
                No hay tomas de asistencia en esta fecha. Elija otro día.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function RegistrosAprendizPanel({ fechaDesde, fechaHasta, regionalId, sedeId }: Props) {
  const [query, setQuery] = useState('');
  const [queryAplicada, setQueryAplicada] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fichas, setFichas] = useState<FichaExplorar[]>([]);
  const [fichaSel, setFichaSel] = useState<FichaExplorar | null>(null);
  const [aprendices, setAprendices] = useState<AprendizResumen[]>([]);
  const [filtroAprendiz, setFiltroAprendiz] = useState('');
  const [aprendizSel, setAprendizSel] = useState<AprendizResumen | null>(null);
  const [registros, setRegistros] = useState<AnalisisRegistrosAprendizResponse | null>(null);

  const scopeParams = useMemo(
    () => ({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      regional_id: regionalId,
      sede_id: sedeId,
    }),
    [fechaDesde, fechaHasta, regionalId, sedeId],
  );

  const listaRegistros = registros?.aprendices[0]?.registros ?? [];

  const limpiarBusqueda = () => {
    setQuery('');
    setQueryAplicada('');
    setError('');
    setFichas([]);
    setFichaSel(null);
    setAprendices([]);
    setAprendizSel(null);
    setRegistros(null);
    setFiltroAprendiz('');
  };

  const explorar = async () => {
    const q = query.trim();
    if (!q) {
      setError('Escriba número de ficha, programa, nombre o documento.');
      return;
    }
    setLoading(true);
    setError('');
    setFichaSel(null);
    setAprendices([]);
    setAprendizSel(null);
    setRegistros(null);
    try {
      const res = await apiService.getAsistenciaAnalisisExplorarFichas({
        q,
        regional_id: regionalId,
        sede_id: sedeId,
      });
      setQueryAplicada(res.query);
      setFichas(res.fichas);
      if (res.fichas.length === 0) {
        setError('Sin coincidencias para esa búsqueda.');
      }
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo buscar fichas.'));
      setFichas([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirFicha = async (f: FichaExplorar) => {
    setLoading(true);
    setError('');
    setFichaSel(f);
    setAprendizSel(null);
    setRegistros(null);
    setFiltroAprendiz('');
    try {
      const filtroInicial =
        f.coincidencias_aprendiz > 0 && queryAplicada ? queryAplicada : undefined;
      const res = await apiService.getAsistenciaAnalisisAprendicesFicha({
        ficha: f.ficha_numero,
        q: filtroInicial,
        ...scopeParams,
      });
      setAprendices(res.aprendices);
      if (filtroInicial) setFiltroAprendiz(filtroInicial);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo cargar aprendices de la ficha.'));
      setAprendices([]);
    } finally {
      setLoading(false);
    }
  };

  const filtrarAprendicesLocal = async () => {
    if (!fichaSel) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiService.getAsistenciaAnalisisAprendicesFicha({
        ficha: fichaSel.ficha_numero,
        q: filtroAprendiz.trim() || undefined,
        ...scopeParams,
      });
      setAprendices(res.aprendices);
      setAprendizSel(null);
      setRegistros(null);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo filtrar aprendices.'));
    } finally {
      setLoading(false);
    }
  };

  const verRegistros = async (ap: AprendizResumen) => {
    if (!fichaSel) return;
    setLoading(true);
    setError('');
    setAprendizSel(ap);
    try {
      const res = await apiService.getAsistenciaAnalisisRegistrosAprendiz({
        ficha: fichaSel.ficha_numero,
        aprendiz_id: ap.aprendiz_id,
        ...scopeParams,
      });
      setRegistros(res);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo cargar el historial.'));
      setRegistros(null);
    } finally {
      setLoading(false);
    }
  };

  const volverAFichas = () => {
    setFichaSel(null);
    setAprendices([]);
    setAprendizSel(null);
    setRegistros(null);
    setFiltroAprendiz('');
  };

  const volverAAprendices = () => {
    setAprendizSel(null);
    setRegistros(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <UserGroupIcon className="w-5 h-5 text-primary-600" aria-hidden />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          D — Ingreso y salida por aprendiz
        </h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Busque por ficha, programa, nombre o documento. Elija la ficha, luego el aprendiz y el día
        para ver ingreso y salida.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800 space-y-4">
        {!fichaSel ? (
          <>
            <div className="space-y-1">
              <label htmlFor="reg-q" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Buscar ficha, programa, nombre o documento
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reg-q"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void explorar();
                      }
                    }}
                    placeholder={PLACEHOLDER_BUSCAR}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm transition-shadow focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void explorar()}
                  disabled={loading}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                >
                  <MagnifyingGlassIcon className="w-4 h-4" aria-hidden />
                  {loading ? 'Buscando…' : 'Buscar'}
                </button>
                {query.trim() || queryAplicada || fichas.length > 0 ? (
                  <button
                    type="button"
                    onClick={limpiarBusqueda}
                    disabled={loading}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Quitar
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ej. 3173334 o Análisis y desarrollo de software
              </p>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            {fichas.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fichas.map((f) => (
                  <FichaCaracterizacionCard
                    key={f.ficha_id}
                    ficha={toFichaCard(f)}
                    showStatusBadge
                    footerLeft={
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 dark:text-primary-300">
                        <UsersIcon className="h-4 w-4" aria-hidden />
                        {f.cantidad_aprendices} aprendices
                      </span>
                    }
                    extra={
                      f.coincidencias_aprendiz > 0 ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          {f.coincidencias_aprendiz} coincidencia(s) con «{queryAplicada}»
                        </p>
                      ) : null
                    }
                    actions={
                      <button
                        type="button"
                        onClick={() => void abrirFicha(f)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                      >
                        Ver aprendices
                      </button>
                    }
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {fichaSel && !aprendizSel ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={volverAFichas}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <ArrowLeftIcon className="w-4 h-4" aria-hidden />
                Volver a fichas
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ficha <strong>{fichaSel.ficha_numero}</strong>
                {fichaSel.programa_nombre ? ` — ${fichaSel.programa_nombre}` : ''}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={filtroAprendiz}
                onChange={(e) => setFiltroAprendiz(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void filtrarAprendicesLocal();
                  }
                }}
                placeholder={PLACEHOLDER_FILTRO_APRENDIZ}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => void filtrarAprendicesLocal()}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Filtrar
              </button>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Documento</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Nombre</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Registros</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {aprendices.map((ap) => (
                    <tr key={ap.aprendiz_id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-3 py-2 tabular-nums">{ap.numero_documento || '—'}</td>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                        {ap.nombre_completo}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{ap.total_registros}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => void verRegistros(ap)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          Ver ingresos/salidas
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && aprendices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-gray-500">
                        No hay aprendices para mostrar.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {fichaSel && aprendizSel ? (
          <HistorialIngresoSalida
            aprendiz={aprendizSel}
            fichaNumero={fichaSel.ficha_numero}
            registros={listaRegistros}
            loading={loading}
            error={error}
            onVolver={volverAAprendices}
          />
        ) : null}
      </div>
    </section>
  );
}
