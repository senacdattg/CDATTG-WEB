import { useCallback, useEffect, useState, useRef, type FormEvent, type ChangeEvent, type ReactNode } from 'react';
import {
  IdentificationIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  KeyIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type {
  CredencialSofiaEstado,
  VerificarAspiranteResponse,
  VerificarLoteResponse,
} from '../../types';

const ESTADO_LABEL: Record<string, string> = {
  REGISTRADO: 'Registrado',
  NO_REGISTRADO: 'No registrado',
  NO_VERIFICADO: 'No verificado',
};

const ROL_DEFAULT = 'Encargado de ingreso centro formación';

const TIPOS_LOGIN: { codigo: string; label: string }[] = [
  { codigo: 'Cédula de Ciudadanía', label: 'Cédula de Ciudadanía' },
  { codigo: 'Tarjeta de Identidad', label: 'Tarjeta de Identidad' },
  { codigo: 'Cédula de Extranjería', label: 'Cédula de Extranjería' },
  { codigo: 'PEP', label: 'PEP' },
  { codigo: 'Permiso por Protección Temporal', label: 'Permiso por Protección Temporal' },
];

export const ComplementariosVerificacionPage = () => {
  const [credencial, setCredencial] = useState<CredencialSofiaEstado | null>(null);
  const [credLoading, setCredLoading] = useState(true);

  const cargarCredencial = useCallback(async () => {
    setCredLoading(true);
    try {
      const c = await apiService.getCredencialSofia();
      setCredencial(c);
    } catch {
      setCredencial({ tiene: false });
    } finally {
      setCredLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarCredencial();
  }, [cargarCredencial]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <IdentificationIcon className="w-7 h-7" aria-hidden /> Complementarios · Verificación de aspirantes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Consulta en SofiaPlus (Consultar Registro) con su usuario SENA para identificar el tipo de documento con
          precisión.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VerificacionPanel tieneCredencial={!!credencial?.tiene} />
          <CargaMasivaPanel tieneCredencial={!!credencial?.tiene} />
        </div>

        <aside className="space-y-4">
          <CredencialSofiaPanel
            credencial={credencial}
            loading={credLoading}
            onActualizado={cargarCredencial}
          />

          <div className="card text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cómo funciona</h3>
            <p>
              El sistema inicia sesión en SofiaPlus con <strong>su usuario SENA</strong>, elige el rol{' '}
              <strong>Encargado de ingreso centro formación</strong> y consulta en{' '}
              <strong>SGS → Gestionar SGS → Consultar Registro</strong>.
            </p>
            <p>
              Solo ingrese el <strong>número de documento</strong>. El sistema prueba los tipos hasta encontrar con
              cuál está registrado en SofiaPlus.
            </p>
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              Si SofiaPlus no responde, verá <strong>&nbsp;No verificado</strong> (reintentar). Eso no significa
              &ldquo;no registrado&rdquo;.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const CredencialSofiaPanel = ({
  credencial,
  loading,
  onActualizado,
}: {
  credencial: CredencialSofiaEstado | null;
  loading: boolean;
  onActualizado: () => void;
}) => {
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState('Cédula de Ciudadanía');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(ROL_DEFAULT);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const abrirFormulario = () => {
    setTipo(credencial?.tipo_documento ?? 'Cédula de Ciudadanía');
    setUsuario(credencial?.usuario ?? '');
    setPassword('');
    setRol(credencial?.rol ?? ROL_DEFAULT);
    setEditando(true);
    setError('');
  };

  const handleGuardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Usuario y contraseña SENA son obligatorios.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await apiService.guardarCredencialSofia({
        tipo_documento: tipo,
        usuario: usuario.trim(),
        password,
        rol: rol.trim() || ROL_DEFAULT,
      });
      setEditando(false);
      setPassword('');
      onActualizado();
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo guardar la credencial.'));
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!window.confirm('¿Eliminar su usuario SENA guardado?')) return;
    setGuardando(true);
    setError('');
    try {
      await apiService.eliminarCredencialSofia();
      setEditando(false);
      onActualizado();
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo eliminar.'));
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
        <ArrowPathIcon className="w-4 h-4 animate-spin" aria-hidden /> Cargando usuario SENA…
      </div>
    );
  }

  if (editando) {
    return (
      <form onSubmit={handleGuardar} className="card space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <KeyIcon className="w-5 h-5" aria-hidden /> Mi usuario SENA
        </h3>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tipo de documento</label>
          <select className="input-field text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_LOGIN.map((t) => (
              <option key={t.codigo} value={t.codigo}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Número de documento</label>
          <input
            className="input-field text-sm"
            inputMode="numeric"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Su documento SENA"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Contraseña SofiaPlus</label>
          <input
            type="password"
            className="input-field text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rol en SofiaPlus</label>
          <input className="input-field text-sm" value={rol} onChange={(e) => setRol(e.target.value)} />
        </div>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary text-sm" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="btn-secondary text-sm" onClick={() => setEditando(false)} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <KeyIcon className="w-5 h-5" aria-hidden /> Mi usuario SENA
      </h3>
      {credencial?.tiene ? (
        <>
          <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" aria-hidden /> Usuario SENA registrado
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {credencial.tipo_documento} · {credencial.usuario}
            {credencial.actualizada_en ? (
              <span className="block text-xs text-gray-500">actualizado {credencial.actualizada_en}</span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary text-sm flex items-center gap-1" onClick={abrirFormulario}>
              <PencilSquareIcon className="w-4 h-4" aria-hidden /> Cambiar
            </button>
            <button
              type="button"
              className="btn-secondary text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
              onClick={handleEliminar}
              disabled={guardando}
            >
              <TrashIcon className="w-4 h-4" aria-hidden /> Eliminar
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Registre su usuario y contraseña de SofiaPlus para poder verificar aspirantes.
          </p>
          <button type="button" className="btn-primary text-sm" onClick={abrirFormulario}>
            Registrar usuario SENA
          </button>
        </>
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

const VerificacionPanel = ({ tieneCredencial }: { tieneCredencial: boolean }) => {
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<VerificarAspiranteResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const doc = numero.trim();
    if (!doc) {
      setError('Ingrese un número de documento.');
      return;
    }
    if (!tieneCredencial) {
      setError('Registre su usuario SENA antes de verificar.');
      return;
    }
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await apiService.verificarAspirante({ numero_documento: doc });
      setResultado(res);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo completar la verificación.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Consulta individual</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Ingrese solo el número. El sistema prueba los tipos de documento en Consultar Registro hasta encontrar el
        correcto (~30–90 s según SofiaPlus).
      </p>

      <div>
        <label htmlFor="numero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Número de documento del aspirante
        </label>
        <input
          id="numero"
          type="text"
          inputMode="numeric"
          className="input-field max-w-md"
          placeholder="Ej. 1012345678"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          disabled={loading || !tieneCredencial}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4" aria-hidden /> {error}
        </p>
      )}

      <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading || !tieneCredencial}>
        {loading ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando en SofiaPlus…
          </>
        ) : (
          <>
            <MagnifyingGlassIcon className="w-5 h-5" aria-hidden /> Verificar
          </>
        )}
      </button>

      {resultado && <ResultadoCard r={resultado} />}
    </form>
  );
};

const CargaMasivaPanel = ({ tieneCredencial }: { tieneCredencial: boolean }) => {
  const [file, setFile] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');
  const [res, setRes] = useState<VerificarLoteResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDescargarPlantilla = async () => {
    setDescargando(true);
    setError('');
    try {
      const blob = await apiService.descargarPlantillaLote();
      descargarBlob(blob, 'plantilla_verificacion_aspirantes.xlsx');
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
      setError('Selecciona el Excel con los documentos.');
      return;
    }
    if (!tieneCredencial) {
      setError('Registre su usuario SENA antes de procesar.');
      return;
    }
    setProcesando(true);
    setError('');
    setRes(null);
    try {
      const r = await apiService.verificarLote(file);
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
      ['numero_documento', 'estado', 'tipo_encontrado', 'nombre', 'mensaje'],
      ...res.resultados.map((r) => [
        r.numero_documento,
        ESTADO_LABEL[r.estado] ?? r.estado,
        r.tipo_encontrado ?? '',
        r.nombre ?? '',
        r.mensaje ?? '',
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const conBom = String.fromCharCode(0xfeff) + csv;
    descargarBlob(new Blob([conBom], { type: 'text/csv;charset=utf-8' }), 'resultados_verificacion.csv');
  };

  const handleExportarErrores = () => {
    if (!res) return;
    const errores = res.resultados.filter((r) => r.estado === 'NO_VERIFICADO');
    if (errores.length === 0) return;
    const filas = [
      ['numero_documento', 'mensaje'],
      ...errores.map((r) => [r.numero_documento, r.mensaje ?? 'Error al verificar']),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const conBom = String.fromCharCode(0xfeff) + csv;
    descargarBlob(new Blob([conBom], { type: 'text/csv;charset=utf-8' }), 'reintentar_verificacion.csv');
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ArrowUpTrayIcon className="w-5 h-5" aria-hidden /> Carga masiva por Excel
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Columna <strong>numero_documento</strong> solamente. Al terminar verá el tipo con el que cada aspirante está
        registrado en SofiaPlus.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-secondary flex items-center gap-1" onClick={handleDescargarPlantilla} disabled={descargando}>
          <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar plantilla
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFile}
          disabled={procesando || !tieneCredencial}
          className="text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-gray-800 dark:file:bg-gray-700 dark:file:text-gray-100"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4" aria-hidden /> {error}
        </p>
      )}

      <button
        className="btn-primary flex items-center gap-2"
        onClick={handleProcesar}
        disabled={procesando || !file || !tieneCredencial}
      >
        {procesando ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Verificando en SofiaPlus…
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
              Registrados: {res.registrados}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-red-800 dark:bg-red-900/40 dark:text-red-300">
              No registrados: {res.no_registrados}
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              No verificados: {res.no_verificados}
            </span>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {res.no_verificados > 0 && (
              <button className="btn-secondary flex items-center gap-1" onClick={handleExportarErrores}>
                <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar para reintentar ({res.no_verificados})
              </button>
            )}
            <button className="btn-secondary flex items-center gap-1" onClick={handleExportarCSV}>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden /> Descargar resultados (CSV)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Tipo registrado</th>
                  <th className="py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {res.resultados.map((r) => (
                  <tr key={r.numero_documento} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{r.numero_documento}</td>
                    <td className="py-2 pr-4">
                      <EstadoBadge estado={r.estado} />
                    </td>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{r.tipo_encontrado ?? '—'}</td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">{r.nombre ?? r.mensaje ?? ''}</td>
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

const EstadoBadge = ({ estado }: { estado: string }) => {
  const clases: Record<string, string> = {
    REGISTRADO: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    NO_REGISTRADO: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    NO_VERIFICADO: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${clases[estado] ?? clases.NO_VERIFICADO}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
};

const descargarBlob = (blob: Blob, nombre: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
};

const ResultadoCard = ({ r }: { r: VerificarAspiranteResponse }) => {
  const estilos: Record<string, { icon: ReactNode; label: string; box: string }> = {
    REGISTRADO: {
      icon: <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" aria-hidden />,
      label: 'Registrado en SofiaPlus',
      box: 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    },
    NO_REGISTRADO: {
      icon: <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden />,
      label: 'No registrado en SofiaPlus',
      box: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
    },
    NO_VERIFICADO: {
      icon: <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" aria-hidden />,
      label: 'No verificado — reintentar',
      box: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
    },
  };
  const e = estilos[r.estado] ?? estilos.NO_VERIFICADO;

  return (
    <div className={`border rounded-lg p-4 ${e.box}`}>
      <div className="flex items-center gap-3">
        {e.icon}
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{e.label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Documento: {r.numero_documento}</p>
        </div>
      </div>
      <dl className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {r.estado === 'REGISTRADO' && r.tipo_encontrado && (
          <div className="flex gap-2">
            <dt className="font-medium">Tipo registrado:</dt>
            <dd>{r.tipo_encontrado}</dd>
          </div>
        )}
        {r.nombre && (
          <div className="flex gap-2">
            <dt className="font-medium">Nombre:</dt>
            <dd>{r.nombre}</dd>
          </div>
        )}
        {r.mensaje && <p className="text-gray-500 dark:text-gray-400">{r.mensaje}</p>}
      </dl>
    </div>
  );
};
