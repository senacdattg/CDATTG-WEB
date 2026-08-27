/**
 * @module pages/registro/RegistroPage
 * @description Formulario público para crear usuario y contraseña.
 * @author CRANDEYS
 * @created 2026-08-26
 */
import { useEffect, useState, type ComponentProps } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import LogoSena from '../../../logo-sena-verde-complementario-svg-2022.svg';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { portalApi } from '../../services/portalApi';
import { registrarUsuario, type RegisterPayload } from '../../services/registerApi';
import { axiosErrorMessage } from '../../utils/httpError';
import { portalPaths } from '../../routes/paths';
import { mensajeRegistroInvalido } from './registroValidate';
import { RegistroCampos } from './RegistroCampos';
import type { ParametroItem, PaisItem, DepartamentoItem, MunicipioItem } from '../../types';

const vacio: RegisterPayload = {
  tipo_documento: 0, numero_documento: '', primer_nombre: '', segundo_nombre: '',
  primer_apellido: '', segundo_apellido: '', fecha_nacimiento: '', genero: 0,
  telefono: '', celular: '', email: '', pais_id: 0, departamento_id: 0, municipio_id: 0,
  direccion: '', parametro_id: 0, password: '', password_confirm: '',
};

/**
 * Página de registro alineada al login.
 */
export function RegistroPage() {
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState<RegisterPayload>(vacio);
  const [tipos, setTipos] = useState<ParametroItem[]>([]);
  const [generos, setGeneros] = useState<ParametroItem[]>([]);
  const [cars, setCars] = useState<ParametroItem[]>([]);
  const [paises, setPaises] = useState<PaisItem[]>([]);
  const [deps, setDeps] = useState<DepartamentoItem[]>([]);
  const [muns, setMuns] = useState<MunicipioItem[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([
      portalApi.catalogoTiposDocumento(), portalApi.catalogoGeneros(),
      portalApi.catalogoCaracterizacion(), portalApi.catalogoPaises(),
    ]).then(([t, g, c, p]) => { setTipos(t); setGeneros(g); setCars(c); setPaises(p); })
      .catch((cause: unknown) => setError(axiosErrorMessage(cause, 'No se pudieron cargar los catálogos')));
  }, []);

  useEffect(() => {
    if (!form.pais_id) { setDeps([]); return; }
    portalApi.catalogoDepartamentos(form.pais_id).then(setDeps).catch(() => setDeps([]));
  }, [form.pais_id]);

  useEffect(() => {
    if (!form.departamento_id) { setMuns([]); return; }
    portalApi.catalogoMunicipios(form.departamento_id).then(setMuns).catch(() => setMuns([]));
  }, [form.departamento_id]);

  async function onSubmit(e: Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]) {
    e.preventDefault();
    const msg = mensajeRegistroInvalido(form);
    if (msg) { setError(msg); return; }
    setSaving(true);
    setError('');
    try {
      await registrarUsuario(form);
      const home = await login({ email: form.email.trim(), password: form.password });
      nav(home, { replace: true });
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo completar el registro'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <button type="button" onClick={toggleTheme} className="absolute right-4 top-4 rounded-lg bg-white p-2 shadow dark:bg-gray-700" aria-label="Cambiar tema">
        {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5 text-yellow-300" />}
      </button>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <img src={LogoSena} alt="SENA" className="mx-auto h-16 w-16 rounded-2xl shadow-lg" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Regístrese con sus datos y una contraseña.</p>
        </div>
        <form className="card space-y-4" onSubmit={(e) => void onSubmit(e)}>
          {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <RegistroCampos form={form} setForm={setForm} tipos={tipos} generos={generos} cars={cars} paises={paises} deps={deps} muns={muns} />
          <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? 'Registrando…' : 'Crear cuenta'}</button>
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary-700 hover:underline">Ya tengo cuenta</Link>
            {' · '}
            <Link to={portalPaths.index} className="text-primary-700 hover:underline">Portal público</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
