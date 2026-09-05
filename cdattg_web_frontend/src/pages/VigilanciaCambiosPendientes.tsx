import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { mostrarToastApp } from '../utils/appToast';

interface CambioPendiente {
  id: number;
  persona_id: number;
  campos: string;
  estado: string;
  foto_path: string;
  created_at: string;
  persona?: {
    id: number;
    primer_nombre: string;
    primer_apellido: string;
    numero_documento: string;
  };
}

export function VigilanciaCambiosPendientes() {
  const [cambios, setCambios] = useState<CambioPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);
  // Validación doble: primero se presiona el botón y luego se confirma la decisión.
  const [confirmandoAccion, setConfirmandoAccion] = useState<{ id: number; accion: 'aprobar' | 'rechazar' } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await apiService.listarCambiosPendientes();
      setCambios(res.data || []);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al cargar cambios pendientes'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const aprobar = async (id: number) => {
    setProcesando(id);
    setError('');
    try {
      await apiService.aprobarCambioPendiente(id);
      setConfirmandoAccion(null);
      mostrarToastApp({
        icon: 'success',
        titulo: 'Cambio aprobado',
        texto: 'Los cambios fueron aprobados y ya están vigentes.',
        timer: 3000,
      });
      await cargar();
    } catch (e: unknown) {
      mostrarToastApp({
        icon: 'error',
        titulo: 'No se pudo aprobar',
        texto: axiosErrorMessage(e, 'Error al aprobar'),
        timer: 4000,
      });
    } finally {
      setProcesando(null);
    }
  };

  const rechazar = async (id: number) => {
    setProcesando(id);
    setError('');
    try {
      await apiService.rechazarCambioPendiente(id);
      setConfirmandoAccion(null);
      mostrarToastApp({
        icon: 'info',
        titulo: 'Cambio rechazado',
        texto: 'Los cambios fueron rechazados y no se aplican.',
        timer: 3000,
      });
      await cargar();
    } catch (e: unknown) {
      mostrarToastApp({
        icon: 'error',
        titulo: 'No se pudo rechazar',
        texto: axiosErrorMessage(e, 'Error al rechazar'),
        timer: 4000,
      });
    } finally {
      setProcesando(null);
    }
  };

  const parsearCampos = (camposJson: string): Record<string, unknown> => {
    try {
      return JSON.parse(camposJson);
    } catch {
      return {};
    }
  };

  const nombreCampo = (key: string): string => {
    const map: Record<string, string> = {
      tipo_documento: 'Tipo de documento',
      primer_nombre: 'Primer nombre',
      segundo_nombre: 'Segundo nombre',
      primer_apellido: 'Primer apellido',
      segundo_apellido: 'Segundo apellido',
      fecha_nacimiento: 'Fecha de nacimiento',
      genero: 'Género',
      telefono: 'Teléfono',
      celular: 'Celular',
      email: 'Email',
      pais_id: 'País',
      departamento_id: 'Departamento',
      municipio_id: 'Municipio',
      direccion: 'Dirección',
      parametro_id: 'Parametro',
      nivel_escolaridad_id: 'Nivel escolaridad',
      rh: 'Rh',
    };
    return map[key] || key;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cambios pendientes de aprobación</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Los cambios realizados por visitantes requieren aprobación del vigilante antes de aplicarse.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : cambios.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <ClockIcon className="h-5 w-5" />
          No hay cambios pendientes de aprobación.
        </div>
      ) : (
        <div className="space-y-4">
          {cambios.map((c) => {
            const campos = parsearCampos(c.campos);
            const nombre = c.persona
              ? `${c.persona.primer_nombre} ${c.persona.primer_apellido}`
              : `Persona #${c.persona_id}`;
            return (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{nombre}</h3>
                    {c.persona?.numero_documento && (
                      <p className="text-xs text-gray-500">Doc: {c.persona.numero_documento}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    <ClockIcon className="h-3 w-3" />
                    Pendiente
                  </span>
                </div>

                <div className="mb-3 space-y-1">
                  {Object.entries(campos).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{nombreCampo(key)}:</span>
                      <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                    </div>
                  ))}
                  {c.foto_path && (
                    <div className="flex gap-2 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Foto:</span>
                      <span className="text-green-600">Nueva foto adjunta</span>
                    </div>
                  )}
                </div>

                {confirmandoAccion?.id === c.id ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-950/30">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      {confirmandoAccion.accion === 'aprobar'
                        ? '¿Confirmar la aprobación de estos cambios?'
                        : '¿Confirmar el rechazo de estos cambios?'}
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmandoAccion(null)}
                        disabled={procesando === c.id}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void (confirmandoAccion.accion === 'aprobar' ? aprobar(c.id) : rechazar(c.id))
                        }
                        disabled={procesando === c.id}
                        className={`rounded-lg px-3 py-2 text-sm text-white ${
                          confirmandoAccion.accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {procesando === c.id ? 'Procesando…' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmandoAccion({ id: c.id, accion: 'rechazar' })}
                      disabled={procesando === c.id}
                      className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Rechazar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoAccion({ id: c.id, accion: 'aprobar' })}
                      disabled={procesando === c.id}
                      className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Aprobar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
