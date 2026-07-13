import { useCallback, useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { useAuth } from '../../context/AuthContext';
import { asistenciaPaths } from '../../routes/paths';
import type { AprendizResponse, FichaCaracterizacionResponse, InstructorFichaResponse } from '../../types';

const MAX_DIAS_ATRAS = 30;

function fechaLocalISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ayerISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fechaLocalISO(d);
}

function ultimoDiaHabilISO(): string {
  const d = new Date();
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return fechaLocalISO(d);
}

function minFechaISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - MAX_DIAS_ATRAS);
  return fechaLocalISO(d);
}

function ordenarFichas(fichas: FichaCaracterizacionResponse[]): FichaCaracterizacionResponse[] {
  return [...fichas].sort((a, b) => a.ficha.localeCompare(b.ficha, 'es'));
}

export function CargaRetroactivaAsistenciaPage() {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [fichaId, setFichaId] = useState<number | ''>('');
  const [instructores, setInstructores] = useState<InstructorFichaResponse[]>([]);
  const [instructorFichaId, setInstructorFichaId] = useState<number | ''>('');
  const [aprendices, setAprendices] = useState<AprendizResponse[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [fecha, setFecha] = useState(ultimoDiaHabilISO());
  const [motivo, setMotivo] = useState('');
  const [buscarFicha, setBuscarFicha] = useState('');
  const [loadingFichas, setLoadingFichas] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) return;
    (async () => {
      try {
        setLoadingFichas(true);
        const res = await apiService.getFichasCaracterizacion(1, 500);
        const list = ordenarFichas(res.data ?? []);
        setFichas(list);
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'Error al cargar fichas.'));
      } finally {
        setLoadingFichas(false);
      }
    })();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!fichaId) {
      setInstructores([]);
      setInstructorFichaId('');
      setAprendices([]);
      setSeleccionados(new Set());
      return;
    }
    (async () => {
      try {
        setLoadingDetalle(true);
        setError('');
        const [inst, aprs] = await Promise.all([
          apiService.getFichaInstructores(fichaId),
          apiService.getFichaAprendices(fichaId),
        ]);
        setInstructores(inst);
        setInstructorFichaId(inst.length === 1 ? inst[0].id : '');
        const visibles = aprs.filter((a) => a.estado && !a.oculto_en_asistencia);
        setAprendices(visibles);
        setSeleccionados(new Set());
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'Error al cargar instructores o aprendices.'));
      } finally {
        setLoadingDetalle(false);
      }
    })();
  }, [fichaId]);

  const fichasFiltradas = useMemo(() => {
    const q = buscarFicha.trim().toLowerCase();
    const base = ordenarFichas(fichas);
    if (!q) return base;
    return base.filter(
      (f) =>
        f.ficha.toLowerCase().includes(q) ||
        (f.programa_formacion_nombre || '').toLowerCase().includes(q) ||
        (f.instructor_nombre || '').toLowerCase().includes(q),
    );
  }, [fichas, buscarFicha]);

  const fichaSeleccionada = useMemo(
    () => fichas.find((f) => f.id === fichaId),
    [fichas, fichaId],
  );

  const toggleAprendiz = useCallback((id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const seleccionarTodos = useCallback(() => {
    setSeleccionados(new Set(aprendices.map((a) => a.id)));
  }, [aprendices]);

  const enviarAsistencia = async () => {
    setError('');
    setExito('');
    if (!instructorFichaId || !fecha || seleccionados.size === 0 || !motivo.trim()) {
      setError('Complete ficha, instructor, fecha, motivo y al menos un aprendiz.');
      return;
    }
    try {
      setEnviando(true);
      const res = await apiService.registrarAsistenciaRetroactiva({
        instructor_ficha_id: instructorFichaId,
        fecha,
        aprendiz_ids: Array.from(seleccionados),
        motivo: motivo.trim(),
      });
      setExito(
        `Registrados: ${res.registrados}. Omitidos (ya existían): ${res.omitidos}. Sesión #${res.asistencia.id}.`,
      );
      setSeleccionados(new Set());
      setMotivo('');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 403) {
        setError('Solo el superadministrador puede cargar asistencia retroactiva.');
      } else {
        setError(axiosErrorMessage(err, 'No se pudo registrar la asistencia.'));
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit: ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault();
    void enviarAsistencia();
  };

  if (!isSuperAdmin) {
    return (
      <p className="text-red-600 dark:text-red-400">
        Solo el superadministrador puede acceder a la carga retroactiva de asistencia.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClockIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden />
            Carga retroactiva de asistencia
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            Registra asistencia de un día pasado cuando el instructor no pudo tomarla (sin internet u otro
            impedimento). Máximo {MAX_DIAS_ATRAS} días atrás. Solo superadministrador.
          </p>
        </div>
        <Link to={asistenciaPaths.index} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" aria-hidden />
          Volver
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
        >
          {error}
        </div>
      )}
      {exito && (
        <output className="block bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
          {exito}
        </output>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datos de la sesión</h2>

          <div className="relative">
            <label htmlFor="buscar-ficha" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Buscar ficha
            </label>
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3 top-[2.15rem] h-4 w-4 text-gray-400"
              aria-hidden
            />
            <input
              id="buscar-ficha"
              type="search"
              value={buscarFicha}
              onChange={(e) => setBuscarFicha(e.target.value)}
              className="input-field pl-9"
              placeholder="Número, programa o instructor"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ficha-id" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Ficha
              </label>
              <select
                id="ficha-id"
                value={fichaId}
                onChange={(e) => setFichaId(e.target.value ? Number(e.target.value) : '')}
                className="input-field"
                disabled={loadingFichas}
                required
              >
                <option value="">Seleccione ficha…</option>
                {fichasFiltradas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.ficha} — {f.programa_formacion_nombre || 'Sin programa'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="instructor-ficha" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Instructor de la sesión
              </label>
              <select
                id="instructor-ficha"
                value={instructorFichaId}
                onChange={(e) => setInstructorFichaId(e.target.value ? Number(e.target.value) : '')}
                className="input-field"
                disabled={!fichaId || loadingDetalle || instructores.length === 0}
                required
              >
                {instructores.length > 1 && <option value="">Seleccione instructor…</option>}
                {instructores.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.instructor_nombre?.trim() || `Instructor #${i.instructor_id}`}
                    {i.competencia_nombre ? ` — ${i.competencia_nombre}` : ''}
                  </option>
                ))}
              </select>
              {fichaId && !loadingDetalle && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {instructores.length === 0 && 'No hay instructores vinculados a esta ficha.'}
                  {instructores.length === 1 && '1 instructor vinculado (seleccionado automáticamente).'}
                  {instructores.length > 1 &&
                    `${instructores.length} instructores vinculados. Elija quién debía tomar la asistencia ese día.`}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="fecha-retro" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Fecha de la clase
              </label>
              <input
                id="fecha-retro"
                type="date"
                value={fecha}
                min={minFechaISO()}
                max={ayerISO()}
                onChange={(e) => setFecha(e.target.value)}
                className="input-field max-w-full"
                required
              />
            </div>

            {fichaSeleccionada && (
              <div className="flex flex-col justify-end text-sm text-gray-600 dark:text-gray-400">
                <span>
                  Programa: {fichaSeleccionada.programa_formacion_nombre || '—'}
                </span>
                <span>Jornada: {fichaSeleccionada.jornada_nombre || '—'}</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="motivo" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Motivo (obligatorio)
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="input-field min-h-[88px] resize-y"
              placeholder="Ej.: Instructor sin internet el día de la clase"
              required
            />
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aprendices presentes{' '}
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400 tabular-nums">
                ({seleccionados.size}/{aprendices.length})
              </span>
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                onClick={seleccionarTodos}
                disabled={aprendices.length === 0}
              >
                Todos
              </button>
            </div>
          </div>

          {loadingDetalle && (
            <output className="block text-sm text-gray-500 dark:text-gray-400">
              Cargando aprendices…
            </output>
          )}
          {!loadingDetalle && fichaId && aprendices.length === 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              No hay aprendices visibles en esta ficha.
            </p>
          )}

          {aprendices.length > 0 && (
            <ul className="max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600 bg-gray-50 dark:bg-gray-900/40">
              {aprendices.map((a) => (
                <li key={a.id} className="px-4 py-2.5 hover:bg-white/60 dark:hover:bg-gray-700/40 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(a.id)}
                      onChange={() => toggleAprendiz(a.id)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {a.persona_nombre}
                      {a.persona_documento ? (
                        <span className="text-gray-500 dark:text-gray-400 ml-2 tabular-nums">
                          Doc. {a.persona_documento}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={enviando || loadingDetalle}>
            {enviando ? 'Guardando…' : 'Registrar asistencia retroactiva'}
          </button>
        </div>
      </form>
    </div>
  );
}
