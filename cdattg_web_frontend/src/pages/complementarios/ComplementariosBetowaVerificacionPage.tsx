import { useState, useRef, type FormEvent, type ChangeEvent, type ReactNode } from 'react';
import {
  IdentificationIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { VerificarAspiranteResponse, VerificarLoteResponse } from '../../types';

const ESTADO_LABEL: Record<string, string> = {
  REGISTRADO: 'Registrado',
  NO_REGISTRADO: 'No registrado',
  NO_VERIFICADO: 'No verificado',
};

export const ComplementariosBetowaVerificacionPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <IdentificationIcon className="w-7 h-7" aria-hidden /> Complementarios · Verificación Betowa
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Consulta si un aspirante ya tiene cuenta en{' '}
          <a
            href="https://betowa.sena.edu.co/registrarse"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-700 dark:text-green-400 underline"
          >
            Betowa
          </a>{' '}
          mediante el formulario de registro. No requiere credenciales SENA.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VerificacionPanel />
          <CargaMasivaPanel />
        </div>

        <aside className="space-y-4">
          <div className="card text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cómo funciona</h3>
            <p>
              El sistema abre el formulario de registro de Betowa, ingresa el número de documento (y prueba tipos si
              hace falta) con datos aleatorios de expedición, acepta términos y pulsa <strong>Continuar</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Modal «ya existe una cuenta»</strong> → registrado en Betowa (tipo correcto).
              </li>
              <li>
                <strong>Modal «Ya cuentas con un registro con…»</strong> → registrado con otro tipo (el mensaje indica
                cuál).
              </li>
              <li>
                <strong>Avanza a información básica</strong> → no registrado (no se llenan más campos).
              </li>
            </ul>
            <p className="text-amber-600 dark:text-amber-400 flex items-start gap-1">
              <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
              Si Betowa no responde, verá <strong>&nbsp;No verificado</strong> (reintentar).
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

const VerificacionPanel = () => {
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
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const res = await apiService.verificarAspiranteBetowa({ numero_documento: doc });
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
        Ingrese solo el número. El sistema consulta Betowa automáticamente (~20–40 s por documento).
      </p>

      <div>
        <label htmlFor="numero-betowa" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Número de documento del aspirante
        </label>
        <input
          id="numero-betowa"
          type="text"
          inputMode="numeric"
          className="input-field max-w-md"
          placeholder="Ej. 1012345678"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4" aria-hidden /> {error}
        </p>
      )}

      <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
        {loading ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Consultando en Betowa…
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

const CargaMasivaPanel = () => {
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
    setProcesando(true);
    setError('');
    setRes(null);
    try {
      const r = await apiService.verificarLoteBetowa(file);
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
      ['numero_documento', 'estado', 'tipo_encontrado', 'mensaje'],
      ...res.resultados.map((r) => [
        r.numero_documento,
        ESTADO_LABEL[r.estado] ?? r.estado,
        r.tipo_encontrado ?? '',
        r.mensaje ?? '',
      ]),
    ];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const conBom = String.fromCharCode(0xfeff) + csv;
    descargarBlob(new Blob([conBom], { type: 'text/csv;charset=utf-8' }), 'resultados_verificacion_betowa.csv');
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
    descargarBlob(new Blob([conBom], { type: 'text/csv;charset=utf-8' }), 'reintentar_verificacion_betowa.csv');
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ArrowUpTrayIcon className="w-5 h-5" aria-hidden /> Carga masiva por Excel
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Columna <strong>numero_documento</strong> solamente. Procesa hasta 4 documentos en paralelo (~1 min por cada 4
        filas). Un Excel de 20 filas suele tardar unos 5 minutos.
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
          disabled={procesando}
          className="text-sm text-gray-700 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-gray-800 dark:file:bg-gray-700 dark:file:text-gray-100"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="w-4 h-4" aria-hidden /> {error}
        </p>
      )}

      <button className="btn-primary flex items-center gap-2" onClick={handleProcesar} disabled={procesando || !file}>
        {procesando ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" aria-hidden /> Verificando en Betowa…
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
                    <td className="py-2 text-gray-500 dark:text-gray-400">{r.mensaje ?? r.detalle ?? ''}</td>
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
      label: 'Registrado en Betowa',
      box: 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    },
    NO_REGISTRADO: {
      icon: <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden />,
      label: 'No registrado en Betowa',
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
        {r.mensaje && <p className="text-gray-500 dark:text-gray-400">{r.mensaje}</p>}
        {r.detalle && r.detalle !== r.mensaje && (
          <p className="text-gray-500 dark:text-gray-400 text-xs">{r.detalle}</p>
        )}
      </dl>
    </div>
  );
};
