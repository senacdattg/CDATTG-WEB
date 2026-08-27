/**
 * @module pages/registro/RegistroFormulario
 * @description Asistente de crear cuenta: progreso, paso activo y envío.
 * @author Cristian Deysdayr Jiménez
 */
import { useState, type ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registrarUsuario } from '../../services/registerApi';
import { axiosErrorMessage } from '../../utils/httpError';
import { RegistroAcciones } from './RegistroAcciones';
import { RegistroAvisoDatos } from './RegistroAvisoDatos';
import { RegistroCampos } from './RegistroCampos';
import { RegistroProgreso } from './RegistroProgreso';
import { TOTAL_PASOS } from './registroForm';
import { useRegistroCatalogos } from './useRegistroCatalogos';
import { useRegistroWizard } from './useRegistroWizard';

/**
 * Formulario por pasos con borrador local (sin contraseña).
 */
export function RegistroFormulario() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [saving, setSaving] = useState(false);
  const w = useRegistroWizard();
  const cats = useRegistroCatalogos(w.form.pais_id, w.form.departamento_id);

  async function onSubmit(e: Parameters<NonNullable<ComponentProps<'form'>['onSubmit']>>[0]) {
    e.preventDefault();
    if (w.paso < TOTAL_PASOS - 1) { w.avanzar(); return; }
    if (w.puedeEnviar()) return;
    setSaving(true);
    w.setError('');
    try {
      await registrarUsuario({ ...w.form, direccion: '' });
      w.limpiarBorrador();
      const home = await login({ email: w.form.email.trim(), password: w.form.password });
      nav(home, { replace: true });
    } catch (cause: unknown) {
      w.setError(axiosErrorMessage(cause, 'No se pudo completar el registro'));
    } finally {
      setSaving(false);
    }
  }

  const bind = { errores: w.errores, tocar: w.tocar };
  const alerta = w.error || cats.errorCatalogo;
  return (
    <form className="card space-y-8" onSubmit={(e) => void onSubmit(e)}>
      <RegistroProgreso paso={w.paso} />
      {w.paso === 0 ? <RegistroAvisoDatos /> : null}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Si sale de esta página, podrá continuar aquí. La contraseña no se guarda.
      </p>
      {alerta ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">{alerta}</p>
      ) : null}
      <RegistroCampos
        paso={w.paso} form={w.form} set={w.setCampo} setForm={w.setForm} bind={bind}
        tipos={cats.tipos} generos={cats.generos} cars={cats.cars}
        paises={cats.paises} deps={cats.deps} muns={cats.muns}
        ids={w.ids} onToggle={(id) => w.onToggle(id, cats.cars)}
      />
      <RegistroAcciones paso={w.paso} saving={saving} onAtras={w.atras} />
    </form>
  );
}
