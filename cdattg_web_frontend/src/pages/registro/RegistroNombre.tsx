/**
 * @module pages/registro/RegistroNombre
 * @description Paso 2: nombres y apellidos (4 campos).
 * @author Cristian Deysdayr Jiménez
 */
import { UserIcon } from '@heroicons/react/24/outline';
import type { RegisterPayload } from '../../services/registerApi';
import { claseInput, RegistroCampo } from './RegistroCampo';
import { RegistroSeccion } from './RegistroSeccion';
import type { RegistroCampoBind, RegistroSetCampo } from './registroForm';

type Props = Readonly<{
  form: RegisterPayload;
  set: RegistroSetCampo;
  bind: RegistroCampoBind;
}>;

/**
 * Nombre legal de la persona.
 */
export function RegistroNombre({ form, set, bind }: Props) {
  const { errores, tocar } = bind;
  return (
    <RegistroSeccion titulo="Nombre" icono={<UserIcon className="h-5 w-5 text-primary-600" aria-hidden />}>
      <RegistroCampo htmlFor="reg-pnombre" texto="Primer nombre" error={errores.primer_nombre}>
        <input id="reg-pnombre" className={claseInput(errores.primer_nombre)} value={form.primer_nombre} onChange={(e) => set('primer_nombre', e.target.value)} onBlur={() => tocar('primer_nombre')} aria-invalid={Boolean(errores.primer_nombre)} aria-required />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-snombre" texto="Segundo nombre" opcional>
        <input id="reg-snombre" className="input-field" value={form.segundo_nombre} onChange={(e) => set('segundo_nombre', e.target.value)} />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-papellido" texto="Primer apellido" error={errores.primer_apellido}>
        <input id="reg-papellido" className={claseInput(errores.primer_apellido)} value={form.primer_apellido} onChange={(e) => set('primer_apellido', e.target.value)} onBlur={() => tocar('primer_apellido')} aria-invalid={Boolean(errores.primer_apellido)} aria-required />
      </RegistroCampo>
      <RegistroCampo htmlFor="reg-sapellido" texto="Segundo apellido" opcional>
        <input id="reg-sapellido" className="input-field" value={form.segundo_apellido} onChange={(e) => set('segundo_apellido', e.target.value)} />
      </RegistroCampo>
    </RegistroSeccion>
  );
}
