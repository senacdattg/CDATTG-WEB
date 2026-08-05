import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type {
  ConsultarInscripcionesLoteResponse,
  ConsultarInscripcionesResponse,
  CredencialSofiaEstado,
} from '../../types';

/** Evita FormEvent deprecado en tipados React recientes (Sonar S1874). */
type FormSubmitEvent = { preventDefault: () => void };

const TIPOS_DOC = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PEP', label: 'Permiso especial de permanencia' },
  { value: 'PPT', label: 'Permiso por Protección Temporal' },
  { value: 'PAS', label: 'Pasaporte' },
  { value: 'DNI', label: 'DNI' },
  { value: 'NCS', label: 'Número Ciego SENA' },
];

const ESTADO_LABEL: Record<string, string> = {
  ENCONTRADO: 'Encontrado',
  NO_ENCONTRADO: 'No encontrado',
  NO_VERIFICADO: 'No verificado',
};

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function esEmail(v: string) {
  return v.includes('@');
}

function soloDigitos(v: string) {
  return /^\d+$/.test(v.trim());
}

export const ComplementariosInscripcionesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <AcademicCapIcon className="w-7 h-7" aria-hidden /> Complementarios · Programas de formación
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Consulta en SENA Sofía Plus las inscripciones de un aprendiz y filtra por nombre del programa de formación
          (ficha y estado). Las credenciales de Sofía son independientes del login de este sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CredencialesPanel />
          <ConsultaPanel />
          <CargaMasivaPanel />
        </div>
        <aside className="space-y-4">
          <div className="card text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cómo funciona</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Guarde el <strong>número de documento SENA</strong> y contraseña Sofía (no el correo del sistema).
              </li>
              <li>
                El bot inicia sesión, elige <strong>Usuario SENA</strong> y abre Consultar Inscripciones.
              </li>
              <li>Recorre páginas con <strong>Siguiente</strong> y filtra por programa de formación.</li>
            </ol>
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              Cada consulta usa navegador automatizado (puede tardar 30 s–2 min).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const CredencialesPanel = () => {
  const [estado, setEstado] = useState<CredencialSofiaEstado | null>(null);
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState('CC');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  // Evita que el navegador autocompletes con el correo del login de CDATTG.
  const [docUnlocked, setDocUnlocked] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await apiService.getCredencialSofia();
      // Backend ya descarta correos inválidos; nunca precargar email del sistema.
      const docOk = Boolean(res.tiene && res.usuario && soloDigitos(res.usuario) && !esEmail(res.usuario));
      setEstado(docOk ? res : { tiene: false });
      setEditando(!docOk);
      setUsuario('');
      setPassword('');
      if (!docOk && res.tiene && res.usuario && (esEmail(res.usuario) || !soloDigitos(res.usuario))) {
        setError('Se eliminó una credencial inválida (parece correo del sistema). Ingrese el documento SENA.');
      }
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo cargar el estado de credenciales.'));
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async (e: FormSubmitEvent) => {
    e.preventDefault();
    const doc = usuario.trim();
    if (!doc || !password) {
      setError('Documento SENA y contraseña son obligatorios.');
      return;
    }
    if (esEmail(doc) || !soloDigitos(doc)) {
      setError('No use el correo de CDATTG. Solo el número de documento de Sofía Plus (dígitos).');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      const tipoLabel = TIPOS_DOC.find((t) => t.value === tipo)?.label ?? 'Cédula de Ciudadanía';
      const res = await apiService.guardarCredencialSofia({
        tipo_documento: tipoLabel,
        usuario: doc,
        password,
        rol: 'Usuario SENA',
      });
      setEstado(res);
      setUsuario('');
      setPassword('');
      setEditando(false);
      setDocUnlocked(false);
      setMsg('Credenciales Sofía guardadas.');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudieron guardar las credenciales.'));
    } finally {
      setLoading(false);
    }
  };

  const eliminar = async () => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await apiService.eliminarCredencialSofia();
      setEstado({ tiene: false });
      setUsuario('');
      setPassword('');
      setEditando(true);
      setDocUnlocked(false);
      setMsg('Credenciales eliminadas.');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudieron eliminar las credenciales.'));
    } finally {
      setLoading(false);
    }
  };

  if (estado?.tiene && !editando) {
    return (
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <KeyIcon className="w-5 h-5" aria-hidden /> Credenciales SENA Sofía
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Guarda en <code className="text-xs">sofia_credenciales</code> (tabla aparte). No es el usuario con el que
          entró a CDATTG.
        </p>
        <p className="text-sm text-green-700 dark:text-green-400">
          Documento Sofía activo: <strong>{estado.usuario}</strong>
          {estado.actualizada_en ? ` · actualizada ${estado.actualizada_en}` : ''}
        </p>
        {msg && <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1"
            onClick={() => {
              setEditando(true);
              setUsuario('');
              setPassword('');
              setDocUnlocked(false);
              setMsg('');
              setError('');
            }}
            disabled={loading}
          >
            <PencilSquareIcon className="w-4 h-4" aria-hidden /> Actualizar
          </button>
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-1"
            onClick={eliminar}
            disabled={loading}
          >
            <TrashIcon className="w-4 h-4" aria-hidden /> Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={guardar} className="card space-y-4" autoComplete="off">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <KeyIcon className="w-5 h-5" aria-hidden /> Credenciales SENA Sofía
      </h2>
      <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-1">
        <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
        Campos vacíos a propósito. Escriba el <strong>documento SENA</strong> (no el correo{' '}
        <em>superadmin@…</em> del sistema).
      </p>

      {/* Señuelos para absorber autocomplete del navegador */}
      <input type="text" name="prevent_user" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden />
      <input
        type="password"
        name="prevent_pass"
        autoComplete="current-password"
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="sofia-tipo-doc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de documento SENA
          </label>
          <select
            id="sofia-tipo-doc"
            name="sofia_tipo_doc_operador"
            className="input-field"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            autoComplete="off"
          >
            {TIPOS_DOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sofia-doc-operador" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de documento SENA
          </label>
          <input
            id="sofia-doc-operador"
            name="sofia_doc_operador_sena"
            type="text"
            inputMode="numeric"
            className="input-field"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value.replace(/\D/g, ''))}
            onFocus={() => setDocUnlocked(true)}
            readOnly={!docUnlocked}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            placeholder="Solo dígitos, ej. 1121958542"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="sofia-clave-operador" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contraseña Sofía Plus
          </label>
          <input
            id="sofia-clave-operador"
            name="sofia_clave_operador_sena"
            type="password"
            className="input-field max-w-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore="true"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {msg && <p className="text-sm text-green-700 dark:text-green-400">{msg}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar credenciales'}
        </button>
        {estado?.tiene && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEditando(false);
              setError('');
              setUsuario('');
              setPassword('');
              setDocUnlocked(false);
            }}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

const ConsultaPanel = () => {
  const [programa, setPrograma] = useState('');
  const [numero, setNumero] = useState('');
  const [tipo, setTipo] = useState('CC');
  const [autoTipo, setAutoTipo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<ConsultarInscripcionesResponse | null>(null);

  const consultar = async (e: FormSubmitEvent) => {
    e.preventDefault();
    const p = programa.trim();
    const n = numero.trim();
    if (!p || !n) {
      setError('Programa de formación y número de documento son obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await apiService.consultarInscripcionesSofia({
        programa: p,
        numero_documento: n,
        tipo_documento: autoTipo ? '' : tipo,
      });
      setResultado(res);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo completar la consulta.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={consultar} className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Consulta individual
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="programa-insc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Programa de formación *
          </label>
          <input
            id="programa-insc"
            type="text"
            className="input-field"
            placeholder="Ej. TECNOLOGO EN ANALISIS Y DESARROLLO DE SOFTWARE"
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="numero-insc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número de identificación del aprendiz *
          </label>
          <input
            id="numero-insc"
            type="text"
            inputMode="numeric"
            className="input-field"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="tipo-insc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de identificación
          </label>
          <select
            id="tipo-insc"
            className="input-field"
            value={tipo}
            disabled={autoTipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS_DOC.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoTipo}
              onChange={(e) => setAutoTipo(e.target.checked)}
            />
            <span>Probar tipos automáticamente</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
        {loading ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando Sofía…
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Consultar
          </>
        )}
      </button>

      {resultado && <ResultadoInscripciones res={resultado} />}
    </form>
  );
};

const CargaMasivaPanel = () => {
  const [file, setFile] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');
  const [res, setRes] = useState<ConsultarInscripcionesLoteResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescargarPlantilla = async () => {
    setDescargando(true);
    setError('');
    try {
      const blob = await apiService.descargarPlantillaInscripciones();
      descargarBlob(blob, 'plantilla_consulta_inscripciones.xlsx');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo descargar la plantilla.'));
    } finally {
      setDescargando(false);
    }
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError('');
    setRes(null);
  };

  const handleProcesar = async () => {
    if (!file) {
      setError('Seleccione el Excel con documento y programa de formación.');
      return;
    }
    setProcesando(true);
    setError('');
    setRes(null);
    try {
      const r = await apiService.consultarInscripcionesLoteSofia(file);
      setRes(r);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo procesar el archivo.'));
    } finally {
      setProcesando(false);
    }
  };

  const handleExportarCSV = () => {
    if (!res) return;
    const filas = [
      ['numero_documento', 'programa_consultado', 'estado', 'ficha', 'programa', 'estado_inscripcion', 'mensaje'],
      ...res.resultados.flatMap((r) => {
        if (!r.registros?.length) {
          return [[
            r.numero_documento,
            r.programa_consultado,
            ESTADO_LABEL[r.estado] ?? r.estado,
            '',
            '',
            '',
            r.mensaje ?? '',
          ]];
        }
        return r.registros.map((reg) => [
          r.numero_documento,
          r.programa_consultado,
          ESTADO_LABEL[r.estado] ?? r.estado,
          reg.ficha,
          reg.programa,
          reg.estado,
          r.mensaje ?? '',
        ]);
      }),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n');
    descargarBlob(
      new Blob([String.fromCodePoint(0xfeff) + csv], { type: 'text/csv;charset=utf-8' }),
      'resultados_inscripciones_sofia.csv',
    );
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ArrowUpTrayIcon className="w-5 h-5" aria-hidden /> Carga masiva por Excel
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Columnas: <strong>numero_documento</strong>, <strong>programa</strong>, <strong>tipo_documento</strong>{' '}
        (opcional). Un solo login Sofía; las filas se consultan en secuencia.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-secondary flex items-center gap-1"
          onClick={handleDescargarPlantilla}
          disabled={descargando}
        >
          <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar plantilla
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFile}
          disabled={procesando}
          className="text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-gray-800 dark:file:bg-gray-700 dark:file:text-gray-100"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4" aria-hidden /> {error}
        </p>
      )}

      <button
        type="button"
        className="btn-primary flex items-center gap-2"
        onClick={handleProcesar}
        disabled={procesando || !file}
      >
        {procesando ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando lote en Sofía…
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Procesar archivo
          </>
        )}
      </button>

      {res && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-700">Total: {res.total}</span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-green-800 dark:bg-green-900/40 dark:text-green-300">
              Encontrados: {res.encontrados}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              No encontrados: {res.no_encontrados}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-900/40 dark:text-red-300">
              No verificados: {res.no_verificados}
            </span>
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn-secondary flex items-center gap-1" onClick={handleExportarCSV}>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar resultados (CSV)
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Programa consultado</th>
                  <th className="py-2 pr-4">Resultado</th>
                  <th className="py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {res.resultados.map((r) => (
                  <tr
                    key={`${r.numero_documento}-${r.programa_consultado}`}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{r.numero_documento}</td>
                    <td className="py-2 pr-4 text-gray-900 dark:text-white">{r.programa_consultado}</td>
                    <td className="py-2 pr-4">{ESTADO_LABEL[r.estado] ?? r.estado}</td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">
                      {r.registros?.length
                        ? r.registros.map((x) => `${x.ficha} · ${x.programa} (${x.estado})`).join(' · ')
                        : r.mensaje ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultadoInscripciones = ({ res }: { res: ConsultarInscripcionesResponse }) => {
  let icon = <ExclamationTriangleIcon className="w-6 h-6 text-red-600" aria-hidden />;
  if (res.estado === 'ENCONTRADO') {
    icon = <CheckCircleIcon className="w-6 h-6 text-green-600" aria-hidden />;
  } else if (res.estado === 'NO_ENCONTRADO') {
    icon = <XCircleIcon className="w-6 h-6 text-amber-600" aria-hidden />;
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        {icon}
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {ESTADO_LABEL[res.estado] ?? res.estado}
            {res.tipo_encontrado ? ` · ${res.tipo_encontrado}` : ''}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Documento {res.numero_documento} · Programa {res.programa_consultado}
          </p>
          {res.mensaje && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{res.mensaje}</p>}
        </div>
      </div>

      {res.registros?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-4 font-medium">Ficha</th>
                <th className="py-2 pr-4 font-medium">Programa de formación</th>
                <th className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {res.registros.map((r, i) => (
                <tr key={`${r.ficha}-${r.estado}-${i}`} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{r.ficha}</td>
                  <td className="py-2 pr-4 text-gray-900 dark:text-white">{r.programa}</td>
                  <td className="py-2 text-gray-900 dark:text-white">{r.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
