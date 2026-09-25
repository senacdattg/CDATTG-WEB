import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  CameraIcon,
  IdentificationIcon,
  MapPinIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { EscanerQR } from '../components/EscanerQR';
import { VigilanciaAccesoFoto } from './VigilanciaAccesoFoto';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { normalizarDocumentoEscaneado } from './asistencia/asistenciaUtils';
import { segundosParaSalida } from './vigilancia/esperaSalida';
import type {
  AccesoLookupResponse,
  AccesoMetodoRegistro,
  AccesoModo,
  AccesoRegistroResponse,
  AccesoDentroItem,
  AccesoPersonaFicha,
  AccesoFichaResumen,
  RegionalItem,
  SedeItem,
} from '../types';

const DOC_INPUT_ID = 'porteria-documento-input';
const DEBOUNCE_MS = 2500;
/** Espera tras dejar de digitar/escanear antes de consultar (evita buscar a medias). */
const AUTO_LOOKUP_MS = 3000;
const DOC_MIN_LEN = 5;
const FEEDBACK_MS = 5000;
const STORAGE_KEY = 'porteria_contexto_v1';

const TIPO_LABELS: Record<string, string> = {
  APRENDIZ: 'Aprendiz',
  INSTRUCTOR: 'Instructor',
  ADMINISTRATIVO: 'Administrativo',
  PERSONAL_OPERATIVO_APOYO: 'Personal operativo y de apoyo',
  CONTRATISTA: 'Contratista de prestación de servicios',
  VISITANTE: 'Visitante',
};

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

function fichasParaResumenLookup(lookup: {
  fichas?: AccesoFichaResumen[];
  ficha?: AccesoFichaResumen | null;
}): AccesoFichaResumen[] {
  if (lookup.fichas && lookup.fichas.length > 0) return lookup.fichas;
  if (lookup.ficha) return [lookup.ficha];
  return [];
}

function labelTiposPersona(persona: AccesoPersonaFicha): string {
  let tipos = persona.tipos ?? [];
  if (tipos.length === 0 && persona.tipo_sugerido) {
    tipos = [persona.tipo_sugerido];
  }
  if (tipos.length === 0) return '—';
  return tipos.map(labelTipo).join(' · ');
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

type FeedbackAccion = 'INGRESO' | 'SALIDA' | 'CANCELADO';

function FeedbackBanner({ accion, mensaje }: Readonly<{ accion: FeedbackAccion; mensaje: string }>) {
  const esIngreso = accion === 'INGRESO';
  const esSalida = accion === 'SALIDA';
  const color = esIngreso ? 'bg-emerald-600' : esSalida ? 'bg-amber-500' : 'bg-red-600';
  const etiqueta = esIngreso ? 'INGRESO' : esSalida ? 'SALIDA' : 'CANCELADO';
  return (
    <output
      className={`block rounded-2xl px-6 py-5 text-center text-2xl font-bold tracking-wide text-white shadow-lg sm:text-3xl ${color}`}
    >
      {etiqueta} — {mensaje}
    </output>
  );
}

function FichasVinculadasPanel({ fichas }: Readonly<{ fichas: AccesoFichaResumen[] }>) {
  if (fichas.length === 0) return null;
  const titulo = fichas.length === 1 ? 'Ficha vinculada' : `Fichas vinculadas (${fichas.length})`;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
        {titulo}
      </p>
      {fichas.map((ficha) => (
        <div
          key={ficha.id}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/40"
        >
          <p className="mb-1 text-xs font-semibold text-emerald-900 dark:text-emerald-100">
            {ficha.tipo_formacion_label || 'Formación'}
          </p>
          <dl className="space-y-1">
            <FichaRow label="Nº ficha" value={ficha.numero} />
            <FichaRow label="Nombre / programa" value={ficha.programa_nombre || '—'} />
            <FichaRow label="Jornada" value={ficha.jornada_nombre || '—'} />
            <FichaRow label="Sede ficha" value={ficha.sede_nombre || '—'} />
          </dl>
        </div>
      ))}
    </div>
  );
}

function FichaPersonaResumen({
  persona,
  visitaLabel,
  fichas,
}: Readonly<{
  persona: AccesoPersonaFicha;
  visitaLabel?: string;
  fichas?: AccesoFichaResumen[] | null;
}>) {
  const lista = fichas?.length ? fichas : [];
  return (
    <div className="space-y-3">
      <VigilanciaAccesoFoto documento={persona.numero_documento} tieneFoto={Boolean(persona.tiene_foto)} />
      <dl className="space-y-2 text-sm">
        <FichaRow label="Documento" value={persona.numero_documento} />
        <FichaRow label="Nombre" value={persona.nombre_completo || 'Sin nombre'} />
        <FichaRow label="Contacto" value={persona.celular || persona.email || persona.telefono || '—'} />
        <FichaRow label="Tipo" value={labelTiposPersona(persona)} />
        {visitaLabel ? <FichaRow label="Dentro desde" value={visitaLabel} /> : null}
        {persona.foto_desde_carnet ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Nombre y foto del carnet que validó el instructor.
          </p>
        ) : null}
        <FichasVinculadasPanel fichas={lista} />
        {persona.es_nueva ? (
          <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
            Usuario creado automáticamente. Deberá completar sus datos al iniciar sesión en el sistema.
          </p>
        ) : null}
      </dl>
    </div>
  );
}

function tituloFicha(esIngreso: boolean, alerta: boolean, esIrregular: boolean): string {
  if (!alerta) return esIngreso ? 'Modo ENTRADA' : 'Modo SALIDA';
  if (esIngreso) return 'Entrada bloqueada';
  if (esIrregular) return 'Salida irregular';
  return 'Sin ingreso abierto';
}

function colorBannerFicha(esIngreso: boolean, esIrregular: boolean): string {
  if (esIngreso) return 'bg-emerald-600';
  if (esIrregular) return 'bg-red-600';
  return 'bg-amber-500';
}

/** Cuenta regresiva informativa: cuántos segundos faltan para poder registrar la salida. */
function PanelEsperaSalida({ segundosIniciales }: Readonly<{ segundosIniciales: number }>) {
  const [restante, setRestante] = useState(segundosIniciales);

  useEffect(() => {
    setRestante(segundosIniciales);
  }, [segundosIniciales]);

  const activo = restante > 0;
  useEffect(() => {
    if (!activo) return;
    const timer = globalThis.setInterval(() => {
      setRestante((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => globalThis.clearInterval(timer);
  }, [activo]);

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-center dark:border-amber-700 dark:bg-amber-950/50">
      {activo ? (
        <>
          <p className="text-3xl font-bold tabular-nums text-amber-700 dark:text-amber-300">{restante}</p>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Faltan {restante} segundo{restante === 1 ? '' : 's'} para registrar la salida.
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Espere y vuelva a escanear el documento.
          </p>
        </>
      ) : (
        <>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">✓</p>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            Ya puede registrar la salida.
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            Vuelva a escanear el documento para salir.
          </p>
        </>
      )}
    </div>
  );
}

function PanelFicha({
  lookup,
  flujoSalida,
  confirmando,
  registro,
  autoIngresando,
  cancelando,
  esperaSalidaSegundos,
  onConfirmar,
  onCancelar,
  onCancelarIngreso,
  onOcultarIngreso,
}: Readonly<{
  lookup: AccesoLookupResponse | null;
  /** El flujo efectivo es SALIDA (botón SALIDA o auto-cambio por persona ya adentro). */
  flujoSalida: boolean;
  confirmando: boolean;
  registro?: AccesoRegistroResponse | null;
  autoIngresando?: boolean;
  cancelando?: boolean;
  /** Segundos restantes de la espera; null = sin espera activa. */
  esperaSalidaSegundos?: number | null;
  onConfirmar: () => void;
  onCancelar: () => void;
  onCancelarIngreso: () => void;
  onOcultarIngreso: () => void;
}>) {
  if (registro) {
    // Vista posterior al registro automático: se muestran los datos de la persona.
    if (registro.accion === 'SALIDA') {
      const irregular = Boolean(registro.salida_sin_ingreso);
      return (
        <>
          <div
            className={`rounded-xl px-4 py-3 text-center text-lg font-bold text-white ${
              irregular ? 'bg-red-600' : 'bg-amber-500'
            }`}
          >
            {irregular ? 'SALIDA IRREGULAR REGISTRADA' : 'SALIDA REGISTRADA'}
          </div>
          <p
            className={`rounded-lg border px-3 py-2 text-sm ${
              irregular
                ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
            }`}
          >
            Salida automática registrada. {irregular ? 'Se registró sin ingreso previo.' : 'Verifique que corresponda a esta persona.'}
          </p>
          <FichaPersonaResumen persona={registro.persona} fichas={fichasParaResumenLookup(registro)} />
          <button
            type="button"
            className="btn-secondary min-h-[48px] w-full text-base"
            onClick={onOcultarIngreso}
          >
            Ocultar
          </button>
        </>
      );
    }
    // Entrada automática: comprobar la persona y cancelar si fue error.
    return (
      <>
        <div className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-lg font-bold text-white">
          ENTRADA REGISTRADA
        </div>
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          Ingreso automático. Verifique los datos; si no corresponde a esta persona pulse{' '}
          <strong>Cancelar entrada</strong>.
        </p>
        <FichaPersonaResumen persona={registro.persona} fichas={fichasParaResumenLookup(registro)} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary min-h-[48px] flex-1 text-base"
            disabled={cancelando}
            onClick={onOcultarIngreso}
          >
            Ocultar
          </button>
          <button
            type="button"
            className="btn-secondary min-h-[48px] flex-1 text-base !bg-red-600 hover:!bg-red-700 !text-white"
            disabled={cancelando}
            onClick={onCancelarIngreso}
          >
            {cancelando ? 'Cancelando…' : 'Cancelar entrada'}
          </button>
        </div>
      </>
    );
  }

  if (autoIngresando) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Registrando entrada automática…</p>;
  }

  if (!lookup) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {flujoSalida
          ? 'Escanee o digite un documento para registrar la salida.'
          : 'Escanee o digite un documento para registrar el ingreso.'}
      </p>
    );
  }

  // La salida es siempre automática: aquí solo se informa cuando falta la espera de 10 s.
  // `flujoSalida` cubre también el auto-cambio: ENTRADA + persona ya adentro.
  const esSalida = flujoSalida;
  const esIrregular = esSalida && lookup.permite_salida_sin_ingreso;
  const esperando = esSalida && esperaSalidaSegundos != null;
  const visitaLabel = lookup.visita_abierta
    ? `${formatHora(lookup.visita_abierta.timestamp_entrada)} (${labelTipo(lookup.visita_abierta.tipo_persona)})`
    : undefined;
  const titulo = tituloFicha(false, Boolean(lookup.alerta), esIrregular);

  return (
    <>
      <div className={`rounded-xl px-4 py-3 text-center text-lg font-bold text-white ${colorBannerFicha(false, esIrregular)}`}>
        {titulo}
        {lookup.persona.es_nueva ? ' · Persona nueva' : ''}
      </div>

      {esperando && esperaSalidaSegundos != null ? (
        <PanelEsperaSalida segundosIniciales={esperaSalidaSegundos} />
      ) : null}

      {lookup.alerta && !esperando ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {lookup.alerta}
        </p>
      ) : null}

      <FichaPersonaResumen
        persona={lookup.persona}
        visitaLabel={visitaLabel}
        fichas={fichasParaResumenLookup(lookup)}
      />

      {esSalida ? (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          La salida se registra automáticamente al escanear.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary min-h-[48px] flex-1 text-base !bg-emerald-600 hover:!bg-emerald-700"
              disabled={confirmando || !lookup.puede_confirmar}
              onClick={onConfirmar}
            >
              {confirmando ? 'Registrando…' : 'Confirmar ingreso (Enter)'}
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[48px] px-4"
              disabled={confirmando}
              onClick={onCancelar}
            >
              Cancelar
            </button>
          </div>
          {lookup.puede_confirmar && !confirmando ? (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              Pulse{' '}
              <kbd className="rounded border border-gray-300 px-1.5 py-0.5 font-mono text-[11px] dark:border-gray-600">Enter</kbd>{' '}
              para confirmar.
            </p>
          ) : null}
        </>
      )}
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
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  /** Entrada automática ya registrada; su vista solo ofrece cancelarla. */
  const [registro, setRegistro] = useState<AccesoRegistroResponse | null>(null);
  /** Petición de ingreso automático en vuelo (evita confirmación manual duplicada). */
  const [autoIngresando, setAutoIngresando] = useState(false);
  /** Petición de salida automática en vuelo. */
  const [registrandoSalida, setRegistrandoSalida] = useState(false);
  /** Espera informativa antes de la salida: segundos restantes (null = sin espera). */
  const [esperaSalida, setEsperaSalida] = useState<number | null>(null);
  /** El flujo efectivo es SALIDA: botón SALIDA o auto-cambio por persona ya adentro. */
  const [flujoSalida, setFlujoSalida] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ accion: FeedbackAccion; mensaje: string } | null>(null);
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

  const showFeedback = useCallback((accion: FeedbackAccion, mensaje: string) => {
    setFeedback({ accion, mensaje });
    if (feedbackTimerRef.current) globalThis.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = globalThis.setTimeout(() => setFeedback(null), FEEDBACK_MS);
  }, []);

  const resetTrasRegistro = useCallback(() => {
    setDocumento('');
    setLookup(null);
    setRegistro(null);
    setEsperaSalida(null);
    setFlujoSalida(false);
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
    setEsperaSalida(null);
    setRegistro(null);
    void refreshDentro(sedeId);
    focusDocInput();
  };

  const cambiarModo = (next: AccesoModo) => {
    setModo(next);
    setLookup(null);
    setEsperaSalida(null);
    setFlujoSalida(false);
    setRegistro(null);
    setError('');
    if (contextoListo && regionalId && sedeId) {
      saveContexto({ regionalId, sedeId, modo: next });
    }
    focusDocInput();
  };

  const registrarIngresoAuto = useCallback(
    async (doc: string, metodoRegistro: AccesoMetodoRegistro) => {
      if (!sedeId) return;
      setAutoIngresando(true);
      setError('');
      try {
        const res = await apiService.accesoIngreso({
          numero_documento: doc,
          metodo_registro: metodoRegistro,
          sede_id: sedeId,
        });
        setRegistro(res);
        setLookup(null);
        setDocumento('');
        void refreshDentro(sedeId);
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'No se pudo registrar la entrada automática.'));
      } finally {
        setAutoIngresando(false);
        focusDocInput();
      }
    },
    [sedeId, refreshDentro],
  );

  /** Salida automática: sin confirmación y sin motivo. Respeta la espera de 10 s si hay ingreso abierto. */
  const registrarSalidaAuto = useCallback(
    async (doc: string, metodoRegistro: AccesoMetodoRegistro, permitirSinIngreso: boolean) => {
      if (!sedeId) return;
      setRegistrandoSalida(true);
      setError('');
      try {
        const res = await apiService.accesoSalida({
          numero_documento: doc,
          metodo_registro: metodoRegistro,
          sede_id: sedeId,
          permitir_sin_ingreso: permitirSinIngreso || undefined,
        });
        // Se muestran los datos de la persona, igual que en la entrada.
        setRegistro(res);
        setLookup(null);
        setEsperaSalida(null);
        setDocumento('');
        showFeedback('SALIDA', res.mensaje || 'Salida registrada');
        void refreshDentro(sedeId);
        focusDocInput();
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'No se pudo registrar la salida.'));
        setEsperaSalida(null);
        setLookup(null);
      } finally {
        setRegistrandoSalida(false);
        focusDocInput();
      }
    },
    [sedeId, refreshDentro, showFeedback],
  );

  /**
   * Decide qué hacer tras el lookup de salida.
   * - Sin ingreso abierto (irregular): se registra de inmediato, sin espera.
   * - Con ingreso abierto: solo registra si ya pasaron los 10 s; si no, informa la espera.
   */
  const resolverSalidaAutomatica = useCallback(
    async (res: AccesoLookupResponse, doc: string, metodoRegistro: AccesoMetodoRegistro) => {
      setFlujoSalida(true);
      const irregular = Boolean(res.permite_salida_sin_ingreso) && !res.dentro;
      if (irregular) {
        await registrarSalidaAuto(doc, metodoRegistro, true);
        return;
      }
      const restantes = segundosParaSalida(res);
      if (restantes > 0) {
        setEsperaSalida(restantes);
        return;
      }
      await registrarSalidaAuto(doc, metodoRegistro, false);
    },
    [registrarSalidaAuto],
  );

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
      setEsperaSalida(null);
      setRegistro(null);
      setMetodo(metodoRegistro);
      try {
        const res = await apiService.accesoLookup({
          numero_documento: doc,
          sede_id: sedeId,
          metodo: metodoRegistro,
          modo,
        });
        if (modo === 'SALIDA') {
          // La salida es automática: se consulta y se registra sin confirmación.
          setLookup(res);
          setDocumento('');
          await resolverSalidaAutomatica(res, doc, metodoRegistro);
        } else if (res.dentro) {
          // En ENTRADA, si ya está adentro: se registra la salida sin cambiar a SALIDA.
          const resSalida = await apiService.accesoLookup({
            numero_documento: doc,
            sede_id: sedeId,
            metodo: metodoRegistro,
            modo: 'SALIDA',
          });
          setLookup(resSalida);
          setDocumento('');
          await resolverSalidaAutomatica(resSalida, doc, metodoRegistro);
        } else {
          setFlujoSalida(false);
          setLookup(res);
          setDocumento('');
          // Entrada instantánea solo para personas ya registradas y libres de bloqueos.
          if (!res.persona.es_nueva && res.puede_confirmar) {
            void registrarIngresoAuto(doc, metodoRegistro);
          }
        }
      } catch (e: unknown) {
        setLookup(null);
        setEsperaSalida(null);
        setError(axiosErrorMessage(e, 'No se pudo consultar el documento.'));
      } finally {
        setLoadingLookup(false);
        globalThis.setTimeout(() => {
          enCursoRef.current = false;
        }, 400);
        focusDocInput();
      }
    },
    [contextoListo, sedeId, modo, registrarIngresoAuto, resolverSalidaAutomatica],
  );

  const handleEscaneoCamara = useCallback(
    (doc: string) => {
      void runLookup(doc, 'CAMARA');
    },
    [runLookup],
  );

  // Consulta automática al digitar o al terminar el barrido del láser (sin clic en Buscar).
  useEffect(() => {
    if (!contextoListo || !sedeId || confirmando || loadingLookup || autoIngresando || registrandoSalida) return;
    const doc = normalizarDocumentoEscaneado(documento);
    if (doc.length < DOC_MIN_LEN) return;
    // Con la espera de salida activa se permite re-escanear el mismo documento para salir.
    if (lookup?.persona.numero_documento === doc && esperaSalida === null) return;

    const timer = globalThis.setTimeout(() => {
      void runLookup(documento, 'LASER');
    }, AUTO_LOOKUP_MS);
    return () => globalThis.clearTimeout(timer);
  }, [
    documento,
    contextoListo,
    sedeId,
    confirmando,
    loadingLookup,
    autoIngresando,
    registrandoSalida,
    esperaSalida,
    lookup?.persona.numero_documento,
    runLookup,
  ]);

  /** Solo queda la confirmación manual del INGRESO (persona nueva o bloqueos). La salida es automática. */
  const puedeConfirmarIngreso = Boolean(
    lookup && lookup.puede_confirmar && !flujoSalida && !registro,
  );

  const handleConfirmar = useCallback(async () => {
    if (!lookup || confirmando || autoIngresando || registrandoSalida || registro || !sedeId) return;
    if (flujoSalida || !lookup.puede_confirmar) return;
    const doc = lookup.persona.numero_documento;
    setConfirmando(true);
    setError('');
    try {
      const res = await apiService.accesoIngreso({
        numero_documento: doc,
        metodo_registro: metodo,
        sede_id: sedeId,
      });
      showFeedback('INGRESO', res.mensaje || 'Ingreso registrado');
      void refreshDentro(sedeId);
      resetTrasRegistro();
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo registrar el acceso.'));
    } finally {
      setConfirmando(false);
      focusDocInput();
    }
  }, [
    lookup,
    confirmando,
    autoIngresando,
    registrandoSalida,
    registro,
    sedeId,
    flujoSalida,
    metodo,
    refreshDentro,
    showFeedback,
    resetTrasRegistro,
  ]);

  /** Enter: busca si hay documento nuevo; con ficha de ingreso lista confirma el ingreso. */
  const handleSubmitDocumento: ComponentProps<'form'>['onSubmit'] = (e) => {
    e.preventDefault();
    if (confirmando || loadingLookup || autoIngresando || registrandoSalida) return;
    const doc = normalizarDocumentoEscaneado(documento);
    if (!doc) {
      if (puedeConfirmarIngreso) void handleConfirmar();
      return;
    }
    if (lookup?.persona.numero_documento === doc && puedeConfirmarIngreso) {
      void handleConfirmar();
      return;
    }
    void runLookup(documento, 'LASER');
  };

  // Enter global cuando la ficha de ingreso está lista (p. ej. tras clic en el panel).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      if (confirmando || loadingLookup || autoIngresando || registrandoSalida || registro) return;
      if (!puedeConfirmarIngreso) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      // El input del documento lo maneja el submit del form.
      if (tag === 'INPUT' && target?.id === DOC_INPUT_ID) return;

      const doc = normalizarDocumentoEscaneado(documento);
      if (doc && lookup && doc !== lookup.persona.numero_documento) return;

      e.preventDefault();
      void handleConfirmar();
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [
    confirmando,
    loadingLookup,
    autoIngresando,
    registrandoSalida,
    registro,
    lookup,
    puedeConfirmarIngreso,
    documento,
    handleConfirmar,
  ]);

  const handleCancelarIngreso = useCallback(async () => {
    if (!registro || cancelando || autoIngresando || !sedeId) return;
    setCancelando(true);
    setError('');
    try {
      await apiService.accesoCancelarIngreso({ visita_id: registro.visita_id, sede_id: sedeId });
      showFeedback('CANCELADO', 'Entrada cancelada');
      void refreshDentro(sedeId);
      resetTrasRegistro();
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo cancelar la entrada.'));
    } finally {
      setCancelando(false);
      focusDocInput();
    }
  }, [registro, cancelando, autoIngresando, sedeId, refreshDentro, showFeedback, resetTrasRegistro]);

  const handleOcultarIngreso = useCallback(() => {
    if (!registro || autoIngresando) return;
    // Oculta la vista SIN cancelar: la persona sí ingresó y el vigilante sigue escaneando.
    resetTrasRegistro();
  }, [registro, autoIngresando, resetTrasRegistro]);

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
          <form onSubmit={handleSubmitDocumento} className="mx-auto w-full max-w-xl space-y-2">
            <label
              htmlFor={DOC_INPUT_ID}
              className="block text-center text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Número de documento (láser / manual)
            </label>
            <div className="flex items-stretch gap-2">
              <input
                id={DOC_INPUT_ID}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={documento}
                onChange={(e) => {
                  const next = e.target.value;
                  setDocumento(next);
                  setError('');
                  const norm = normalizarDocumentoEscaneado(next);
                  if (lookup && lookup.persona.numero_documento !== norm) {
                    setLookup(null);
                    setEsperaSalida(null);
                  }
                }}
                placeholder="Apunte el láser o digite el documento"
                className="input-field min-h-[48px] flex-1 text-center text-lg"
                disabled={!escaneoHabilitado || loadingLookup || confirmando || autoIngresando || registrandoSalida}
              />
              <button
                type="submit"
                disabled={
                  !escaneoHabilitado ||
                  loadingLookup ||
                  confirmando ||
                  autoIngresando ||
                  registrandoSalida ||
                  !documento.trim()
                }
                className="btn-primary min-h-[48px] shrink-0 touch-manipulation px-5"
              >
                {loadingLookup ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
            {loadingLookup ? (
              <p className="text-center text-sm text-primary-600 dark:text-primary-400">Buscando…</p>
            ) : (
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Búsqueda automática (~3 s), Enter o botón. Entrada y salida se registran solas; la salida espera 10 s
                desde la entrada.
              </p>
            )}
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
              registroEnCurso={loadingLookup || confirmando || autoIngresando}
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
            flujoSalida={flujoSalida}
            confirmando={confirmando}
            registro={registro}
            autoIngresando={autoIngresando}
            cancelando={cancelando}
            esperaSalidaSegundos={esperaSalida}
            onConfirmar={() => void handleConfirmar()}
            onCancelar={() => {
              setLookup(null);
              setDocumento('');
              setEsperaSalida(null);
              setFlujoSalida(false);
              focusDocInput();
            }}
            onCancelarIngreso={() => void handleCancelarIngreso()}
            onOcultarIngreso={() => void handleOcultarIngreso()}
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
