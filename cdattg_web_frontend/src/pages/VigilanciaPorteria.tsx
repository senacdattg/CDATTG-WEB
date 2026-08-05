import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  CameraIcon,
  IdentificationIcon,
  MapPinIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { EscanerQR } from '../components/EscanerQR';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { normalizarDocumentoEscaneado } from './asistencia/asistenciaUtils';
import type {
  AccesoLookupResponse,
  AccesoMetodoRegistro,
  AccesoModo,
  AccesoMotivoSalida,
  AccesoRegistroResponse,
  AccesoTipoPersona,
  AccesoDentroItem,
  AccesoPersonaFicha,
  AccesoFichaResumen,
  RegionalItem,
  SedeItem,
} from '../types';

const DOC_INPUT_ID = 'porteria-documento-input';
const DEBOUNCE_MS = 2500;
const FEEDBACK_MS = 5000;
const STORAGE_KEY = 'porteria_contexto_v1';

const TIPO_LABELS: Record<string, string> = {
  APRENDIZ: 'Aprendiz',
  INSTRUCTOR: 'Instructor',
  ADMINISTRATIVO: 'Administrativo',
  VISITANTE: 'Visitante',
};

const MOTIVO_LABELS: Record<string, string> = {
  DESCANSO: 'Descanso',
  CAFETERIA: 'Cafetería / panadería',
  FIN_JORNADA: 'Fin de jornada',
  CITA_MEDICA: 'Cita médica',
  NOVEDAD_FAMILIAR: 'Novedad familiar',
  COMISION_INSTITUCIONAL: 'Comisión institucional',
  OTRO: 'Otro',
};

const TIPOS_DEFAULT = ['APRENDIZ', 'INSTRUCTOR', 'ADMINISTRATIVO', 'VISITANTE'];

type ContextoGuardado = { regionalId: number; sedeId: number; modo: AccesoModo };

function focusDocInput() {
  globalThis.setTimeout(() => {
    document.getElementById(DOC_INPUT_ID)?.focus();
  }, 50);
}

function formatHora(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function labelTipo(t: string): string {
  return TIPO_LABELS[t] || t;
}

function resolveTipoInicial(lookup: AccesoLookupResponse): AccesoTipoPersona {
  const sugerido = (lookup.persona.tipo_sugerido || 'VISITANTE').toUpperCase();
  if (lookup.tipos_persona.includes(sugerido)) {
    return sugerido as AccesoTipoPersona;
  }
  return 'VISITANTE';
}

function loadContexto(): ContextoGuardado | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContextoGuardado;
    if (!parsed?.sedeId || !parsed?.regionalId) return null;
    return {
      regionalId: parsed.regionalId,
      sedeId: parsed.sedeId,
      modo: parsed.modo === 'SALIDA' ? 'SALIDA' : 'ENTRADA',
    };
  } catch {
    return null;
  }
}

function saveContexto(ctx: ContextoGuardado) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

function FichaRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

function FeedbackBanner({ accion, mensaje }: Readonly<{ accion: 'INGRESO' | 'SALIDA'; mensaje: string }>) {
  const esIngreso = accion === 'INGRESO';
  return (
    <output
      className={`block rounded-2xl px-6 py-5 text-center text-2xl font-bold tracking-wide text-white shadow-lg sm:text-3xl ${
        esIngreso ? 'bg-emerald-600' : 'bg-amber-500'
      }`}
    >
      {esIngreso ? 'INGRESO' : 'SALIDA'} — {mensaje}
    </output>
  );
}

function FichaPersonaResumen({
  persona,
  visitaLabel,
  ficha,
}: Readonly<{
  persona: AccesoPersonaFicha;
  visitaLabel?: string;
  ficha?: AccesoFichaResumen | null;
}>) {
  return (
    <dl className="space-y-2 text-sm">
      <FichaRow label="Documento" value={persona.numero_documento} />
      <FichaRow label="Nombre" value={persona.nombre_completo || 'Sin nombre'} />
      <FichaRow label="Contacto" value={persona.celular || persona.email || persona.telefono || '—'} />
      <FichaRow label="Tipo sugerido" value={labelTipo(persona.tipo_sugerido) || '—'} />
      {visitaLabel ? <FichaRow label="Dentro desde" value={visitaLabel} /> : null}
      {ficha ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
            Ficha activa
          </p>
          <dl className="space-y-1">
            <FichaRow label="Nº ficha" value={ficha.numero} />
            <FichaRow label="Programa" value={ficha.programa_nombre || '—'} />
            <FichaRow label="Jornada" value={ficha.jornada_nombre || '—'} />
            <FichaRow label="Sede ficha" value={ficha.sede_nombre || '—'} />
          </dl>
        </div>
      ) : null}
      {persona.es_nueva ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
          Usuario creado automáticamente. Deberá completar sus datos al iniciar sesión en el sistema.
        </p>
      ) : null}
    </dl>
  );
}

function FormIngresoTipo({
  tipos,
  tipoPersona,
  onChange,
  disabled,
}: Readonly<{
  tipos: string[];
  tipoPersona: AccesoTipoPersona;
  onChange: (v: AccesoTipoPersona) => void;
  disabled: boolean;
}>) {
  return (
    <div>
      <label htmlFor="porteria-tipo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tipo de persona
      </label>
      <select
        id="porteria-tipo"
        className="input-field w-full"
        value={tipoPersona}
        onChange={(e) => onChange(e.target.value as AccesoTipoPersona)}
        disabled={disabled}
      >
        {tipos.map((t) => (
          <option key={t} value={t}>
            {labelTipo(t)}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormSalidaMotivo({
  motivos,
  motivoSalida,
  observacionSalida,
  onMotivo,
  onObservacion,
  disabled,
}: Readonly<{
  motivos: string[];
  motivoSalida: AccesoMotivoSalida;
  observacionSalida: string;
  onMotivo: (v: AccesoMotivoSalida) => void;
  onObservacion: (v: string) => void;
  disabled: boolean;
}>) {
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="porteria-motivo" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Motivo de salida
        </label>
        <select
          id="porteria-motivo"
          className="input-field w-full"
          value={motivoSalida}
          onChange={(e) => onMotivo(e.target.value as AccesoMotivoSalida)}
          disabled={disabled}
        >
          {motivos.map((m) => (
            <option key={m} value={m}>
              {MOTIVO_LABELS[m] || m}
            </option>
          ))}
        </select>
      </div>
      {motivoSalida === 'OTRO' || observacionSalida !== undefined ? (
        <div>
          <label htmlFor="porteria-obs" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Observación {motivoSalida === 'OTRO' ? '(obligatoria)' : '(opcional)'}
          </label>
          <textarea
            id="porteria-obs"
            className="input-field w-full"
            rows={2}
            value={observacionSalida}
            onChange={(e) => onObservacion(e.target.value)}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
}

function PanelFicha({
  lookup,
  modo,
  tipoPersona,
  motivoSalida,
  observacionSalida,
  confirmando,
  forzarSinIngreso,
  onTipo,
  onMotivo,
  onObservacion,
  onForzarSinIngreso,
  onConfirmar,
  onCancelar,
}: Readonly<{
  lookup: AccesoLookupResponse | null;
  modo: AccesoModo;
  tipoPersona: AccesoTipoPersona;
  motivoSalida: AccesoMotivoSalida;
  observacionSalida: string;
  confirmando: boolean;
  forzarSinIngreso: boolean;
  onTipo: (v: AccesoTipoPersona) => void;
  onMotivo: (v: AccesoMotivoSalida) => void;
  onObservacion: (v: string) => void;
  onForzarSinIngreso: (v: boolean) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}>) {
  if (!lookup) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Escanee o digite un documento para ver la ficha y confirmar {modo === 'ENTRADA' ? 'el ingreso' : 'la salida'}.
      </p>
    );
  }

  const esIngreso = modo === 'ENTRADA';
  const tipos = lookup.tipos_persona?.length ? lookup.tipos_persona : TIPOS_DEFAULT;
  const motivos = lookup.motivos_salida?.length ? lookup.motivos_salida : Object.keys(MOTIVO_LABELS);
  const visitaLabel = lookup.visita_abierta
    ? `${formatHora(lookup.visita_abierta.timestamp_entrada)} (${labelTipo(lookup.visita_abierta.tipo_persona)})`
    : undefined;
  const puedeNormal = lookup.puede_confirmar;
  const puedeIrregular = !esIngreso && lookup.permite_salida_sin_ingreso && forzarSinIngreso;
  const puedeConfirmar = puedeNormal || puedeIrregular;

  let titulo = esIngreso ? 'Modo ENTRADA' : 'Modo SALIDA';
  if (lookup.alerta) titulo = esIngreso ? 'Entrada bloqueada' : forzarSinIngreso ? 'Salida irregular' : 'Sin ingreso abierto';

  return (
    <>
      <div
        className={`rounded-xl px-4 py-3 text-center text-lg font-bold text-white ${
          esIngreso ? 'bg-emerald-600' : forzarSinIngreso ? 'bg-red-600' : 'bg-amber-500'
        }`}
      >
        {titulo}
        {lookup.persona.es_nueva ? ' · Persona nueva' : ''}
      </div>

      {lookup.alerta ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {lookup.alerta}
        </p>
      ) : null}

      <FichaPersonaResumen persona={lookup.persona} visitaLabel={visitaLabel} ficha={lookup.ficha} />

      {esIngreso ? (
        <FormIngresoTipo tipos={tipos} tipoPersona={tipoPersona} onChange={onTipo} disabled={confirmando || !puedeConfirmar} />
      ) : (
        <>
          {lookup.permite_salida_sin_ingreso ? (
            <label className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-100">
              <input
                type="checkbox"
                className="mt-1"
                checked={forzarSinIngreso}
                onChange={(e) => onForzarSinIngreso(e.target.checked)}
                disabled={confirmando}
              />
              <span>
                Registrar <strong>salida sin ingreso previo</strong> (la persona está/salió pero no había registro de
                entrada).
              </span>
            </label>
          ) : null}
          {(puedeNormal || forzarSinIngreso) && (
            <>
              {forzarSinIngreso ? (
                <FormIngresoTipo tipos={tipos} tipoPersona={tipoPersona} onChange={onTipo} disabled={confirmando} />
              ) : null}
              <FormSalidaMotivo
                motivos={motivos}
                motivoSalida={motivoSalida}
                observacionSalida={observacionSalida}
                onMotivo={onMotivo}
                onObservacion={onObservacion}
                disabled={confirmando}
              />
            </>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn-primary min-h-[48px] flex-1 text-base ${
            esIngreso
              ? '!bg-emerald-600 hover:!bg-emerald-700'
              : forzarSinIngreso
                ? '!bg-red-600 hover:!bg-red-700'
                : '!bg-amber-500 hover:!bg-amber-600'
          }`}
          disabled={confirmando || !puedeConfirmar}
          onClick={onConfirmar}
        >
          {confirmando
            ? 'Registrando…'
            : forzarSinIngreso
              ? 'Confirmar salida irregular'
              : esIngreso
                ? 'Confirmar ingreso'
                : 'Confirmar salida'}
        </button>
        <button type="button" className="btn-secondary min-h-[48px] px-4" disabled={confirmando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </>
  );
}

function ListaDentro({
  dentro,
  onRefresh,
}: Readonly<{ dentro: AccesoDentroItem[]; onRefresh: () => void }>) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Personas dentro ahora ({dentro.length})
        </h2>
        <button type="button" className="text-sm text-primary-600 hover:underline dark:text-primary-400" onClick={onRefresh}>
          Actualizar
        </button>
      </div>
      {dentro.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Nadie registrado dentro en este momento.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {dentro.map((item) => (
            <li key={item.visita_id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {item.persona.nombre_completo || item.persona.numero_documento}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {labelTipo(item.tipo_persona)} · {formatHora(item.timestamp_entrada)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function VigilanciaPorteria() {
  const guardado = loadContexto();
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [regionalId, setRegionalId] = useState<number>(guardado?.regionalId ?? 0);
  const [sedeId, setSedeId] = useState<number>(guardado?.sedeId ?? 0);
  const [modo, setModo] = useState<AccesoModo>(guardado?.modo ?? 'ENTRADA');
  const [contextoListo, setContextoListo] = useState(Boolean(guardado?.sedeId));

  const [documento, setDocumento] = useState('');
  const [camaraActiva, setCamaraActiva] = useState(true);
  const [lookup, setLookup] = useState<AccesoLookupResponse | null>(null);
  const [metodo, setMetodo] = useState<AccesoMetodoRegistro>('MANUAL');
  const [tipoPersona, setTipoPersona] = useState<AccesoTipoPersona>('VISITANTE');
  const [motivoSalida, setMotivoSalida] = useState<AccesoMotivoSalida>('DESCANSO');
  const [observacionSalida, setObservacionSalida] = useState('');
  const [forzarSinIngreso, setForzarSinIngreso] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ accion: 'INGRESO' | 'SALIDA'; mensaje: string } | null>(null);
  const [dentro, setDentro] = useState<AccesoDentroItem[]>([]);
  const [catalogError, setCatalogError] = useState('');

  const enCursoRef = useRef(false);
  const ultimoDocRef = useRef<{ doc: string; at: number } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sedesFiltradas = useMemo(
    () => sedes.filter((s) => !regionalId || Number(s.regional_id) === regionalId),
    [sedes, regionalId],
  );

  const sedeNombre = sedes.find((s) => s.id === sedeId)?.nombre || '';
  const regionalNombre = regionales.find((r) => r.id === regionalId)?.nombre || '';

  useEffect(() => {
    Promise.all([apiService.getCatalogosRegionales(), apiService.getCatalogosSedes()])
      .then(([regs, seds]) => {
        setRegionales(regs ?? []);
        setSedes(seds ?? []);
      })
      .catch((e: unknown) => setCatalogError(axiosErrorMessage(e, 'No se pudieron cargar regionales/sedes.')));
  }, []);

  const refreshDentro = useCallback(async (sid: number) => {
    if (!sid) {
      setDentro([]);
      return;
    }
    try {
      const list = await apiService.accesoListDentro(sid);
      setDentro(list ?? []);
    } catch {
      /* listado opcional */
    }
  }, []);

  useEffect(() => {
    if (contextoListo && sedeId) void refreshDentro(sedeId);
    return () => {
      if (feedbackTimerRef.current) globalThis.clearTimeout(feedbackTimerRef.current);
    };
  }, [contextoListo, sedeId, refreshDentro]);

  const showFeedback = useCallback((accion: 'INGRESO' | 'SALIDA', mensaje: string) => {
    setFeedback({ accion, mensaje });
    if (feedbackTimerRef.current) globalThis.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = globalThis.setTimeout(() => setFeedback(null), FEEDBACK_MS);
  }, []);

  const resetTrasRegistro = useCallback(() => {
    setDocumento('');
    setLookup(null);
    setObservacionSalida('');
    setForzarSinIngreso(false);
    focusDocInput();
  }, []);

  const activarContexto = () => {
    if (!regionalId || !sedeId) {
      setError('Seleccione regional y sede antes de continuar.');
      return;
    }
    saveContexto({ regionalId, sedeId, modo });
    setContextoListo(true);
    setError('');
    setLookup(null);
    void refreshDentro(sedeId);
    focusDocInput();
  };

  const cambiarModo = (next: AccesoModo) => {
    setModo(next);
    setLookup(null);
    setForzarSinIngreso(false);
    setError('');
    if (contextoListo && regionalId && sedeId) {
      saveContexto({ regionalId, sedeId, modo: next });
    }
    focusDocInput();
  };

  const runLookup = useCallback(
    async (rawDoc: string, metodoRegistro: AccesoMetodoRegistro) => {
      if (!contextoListo || !sedeId) {
        setError('Primero diligencie regional y sede.');
        return;
      }
      const doc = normalizarDocumentoEscaneado(rawDoc);
      if (!doc) return;

      const now = Date.now();
      const ultimo = ultimoDocRef.current;
      if (enCursoRef.current) return;
      if (ultimo?.doc === doc && now - ultimo.at < DEBOUNCE_MS) return;

      enCursoRef.current = true;
      ultimoDocRef.current = { doc, at: now };
      setLoadingLookup(true);
      setError('');
      setFeedback(null);
      setForzarSinIngreso(false);
      setMetodo(metodoRegistro);
      try {
        const res = await apiService.accesoLookup({
          numero_documento: doc,
          sede_id: sedeId,
          metodo: metodoRegistro,
          modo,
        });
        setLookup(res);
        setDocumento(doc);
        setTipoPersona(resolveTipoInicial(res));
        if (res.motivos_salida?.length) {
          setMotivoSalida(res.motivos_salida[0] as AccesoMotivoSalida);
        }
      } catch (e: unknown) {
        setLookup(null);
        setError(axiosErrorMessage(e, 'No se pudo consultar el documento.'));
      } finally {
        setLoadingLookup(false);
        globalThis.setTimeout(() => {
          enCursoRef.current = false;
        }, 400);
        focusDocInput();
      }
    },
    [contextoListo, sedeId, modo],
  );

  const handleSubmitDocumento: ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault();
    void runLookup(documento, 'LASER');
  };

  const handleEscaneoCamara = useCallback(
    (doc: string) => {
      void runLookup(doc, 'CAMARA');
    },
    [runLookup],
  );

  const handleConfirmar = async () => {
    if (!lookup || confirmando || !sedeId) return;
    const doc = lookup.persona.numero_documento;
    setConfirmando(true);
    setError('');
    try {
      let res: AccesoRegistroResponse;
      if (modo === 'ENTRADA') {
        res = await apiService.accesoIngreso({
          numero_documento: doc,
          tipo_persona: tipoPersona,
          metodo_registro: metodo,
          sede_id: sedeId,
        });
      } else {
        if (motivoSalida === 'OTRO' && !observacionSalida.trim()) {
          setError('Indique una observación cuando el motivo es Otro.');
          setConfirmando(false);
          return;
        }
        res = await apiService.accesoSalida({
          numero_documento: doc,
          motivo_salida: motivoSalida,
          observacion_salida: observacionSalida.trim() || undefined,
          metodo_registro: metodo,
          sede_id: sedeId,
          permitir_sin_ingreso: forzarSinIngreso || undefined,
          tipo_persona: forzarSinIngreso ? tipoPersona : undefined,
        });
      }
      const msg =
        res.mensaje || (res.accion === 'INGRESO' ? 'Ingreso registrado' : 'Salida registrada');
      showFeedback(res.accion, msg);
      void refreshDentro(sedeId);
      resetTrasRegistro();
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo registrar el acceso.'));
    } finally {
      setConfirmando(false);
      focusDocInput();
    }
  };

  const escaneoHabilitado = contextoListo && !!sedeId;

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Portería / Acceso</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Primero elija regional y sede. Luego seleccione ENTRADA o SALIDA y escanee.
        </p>
      </header>

      {catalogError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {catalogError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
          <MapPinIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold">1. Regional y sede</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="porteria-regional" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Regional
            </label>
            <select
              id="porteria-regional"
              className="input-field w-full"
              value={regionalId || ''}
              onChange={(e) => {
                const id = Number(e.target.value) || 0;
                setRegionalId(id);
                setSedeId(0);
                setContextoListo(false);
                setLookup(null);
              }}
            >
              <option value="">Seleccione regional</option>
              {regionales.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="porteria-sede" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sede
            </label>
            <select
              id="porteria-sede"
              className="input-field w-full"
              value={sedeId || ''}
              disabled={!regionalId}
              onChange={(e) => {
                setSedeId(Number(e.target.value) || 0);
                setContextoListo(false);
                setLookup(null);
              }}
            >
              <option value="">Seleccione sede</option>
              {sedesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-primary w-full min-h-[44px]"
              disabled={!regionalId || !sedeId}
              onClick={activarContexto}
            >
              {contextoListo ? 'Contexto activo · Cambiar' : 'Activar y escanear'}
            </button>
          </div>
        </div>
        {contextoListo ? (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
            Activo: <strong>{regionalNombre}</strong> · <strong>{sedeNombre}</strong>
          </p>
        ) : (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
            Debe activar regional y sede antes de escanear.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">2. Modo de registro</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!contextoListo}
            onClick={() => cambiarModo('ENTRADA')}
            className={`flex min-h-[64px] items-center justify-center gap-2 rounded-xl text-lg font-bold text-white transition ${
              modo === 'ENTRADA' ? 'bg-emerald-600 ring-4 ring-emerald-300' : 'bg-emerald-600/50 hover:bg-emerald-600/80'
            } disabled:opacity-40`}
          >
            ENTRADA
          </button>
          <button
            type="button"
            disabled={!contextoListo}
            onClick={() => cambiarModo('SALIDA')}
            className={`flex min-h-[64px] items-center justify-center gap-2 rounded-xl text-lg font-bold text-white transition ${
              modo === 'SALIDA' ? 'bg-amber-500 ring-4 ring-amber-300' : 'bg-amber-500/50 hover:bg-amber-500/80'
            } disabled:opacity-40`}
          >
            SALIDA
          </button>
        </div>
      </section>

      {feedback ? <FeedbackBanner accion={feedback.accion} mensaje={feedback.mensaje} /> : null}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      <div className={`grid gap-4 lg:grid-cols-2 ${escaneoHabilitado ? '' : 'pointer-events-none opacity-50'}`}>
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <IdentificationIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold">3. Documento</h2>
          </div>
          <form onSubmit={handleSubmitDocumento} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor={DOC_INPUT_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Número de documento (láser / manual)
              </label>
              <input
                id={DOC_INPUT_ID}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={documento}
                onChange={(e) => {
                  setDocumento(e.target.value);
                  setError('');
                }}
                placeholder="Apunte el láser o digite y Enter"
                className="input-field w-full text-lg"
                disabled={!escaneoHabilitado || loadingLookup || confirmando}
              />
            </div>
            <button
              type="submit"
              disabled={!escaneoHabilitado || loadingLookup || confirmando || !documento.trim()}
              className="btn-primary min-h-[44px] shrink-0 touch-manipulation"
            >
              {loadingLookup ? 'Buscando…' : 'Buscar'}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <CameraIcon className="h-5 w-5 text-primary-600" />
                <h3 className="font-semibold">Cámara / QR</h3>
              </div>
              <button
                type="button"
                className="text-sm text-primary-600 hover:underline dark:text-primary-400"
                onClick={() => setCamaraActiva((v) => !v)}
              >
                {camaraActiva ? 'Pausar' : 'Activar'}
              </button>
            </div>
            <EscanerQR
              readerId="porteria-qr-reader"
              activo={camaraActiva && escaneoHabilitado}
              continuo
              embedded
              registroEnCurso={loadingLookup || confirmando}
              onEscaneado={handleEscaneoCamara}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <UserCircleIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold">Ficha</h2>
          </div>
          <PanelFicha
            lookup={lookup}
            modo={modo}
            tipoPersona={tipoPersona}
            motivoSalida={motivoSalida}
            observacionSalida={observacionSalida}
            confirmando={confirmando}
            forzarSinIngreso={forzarSinIngreso}
            onTipo={setTipoPersona}
            onMotivo={setMotivoSalida}
            onObservacion={setObservacionSalida}
            onForzarSinIngreso={setForzarSinIngreso}
            onConfirmar={() => void handleConfirmar()}
            onCancelar={() => {
              setLookup(null);
              setDocumento('');
              setForzarSinIngreso(false);
              focusDocInput();
            }}
          />
        </section>
      </div>

      {escaneoHabilitado ? (
        <ListaDentro dentro={dentro} onRefresh={() => void refreshDentro(sedeId)} />
      ) : null}
    </div>
  );
}

export default VigilanciaPorteria;
